-- A displayed quote is a comparison only; authoritative values remain server-derived.
drop function public.create_booking(text,uuid,uuid,timestamptz,text,text,text);
drop function private.create_booking(text,uuid,uuid,timestamptz,text,text,text);
create function private.create_booking(p_host text,p_service uuid,p_staff uuid,p_start timestamptz,p_name text,p_email text,p_token text,p_quote jsonb default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare tid uuid; prior private.booking_capabilities%rowtype; slot record; svc public.services%rowtype; cid uuid; aid uuid; fingerprint bytea; token_digest bytea;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' or p_start is null or p_service is null or p_staff is null then raise exception 'Invalid booking details'; end if;
 tid:=private.booking_tenant(p_host);
 if tid is null then raise exception 'Booking is unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tid::text,7202));
 if private.booking_tenant(p_host) is distinct from tid then raise exception 'Booking is unavailable'; end if;
 p_name:=btrim(p_name); p_email:=lower(btrim(p_email));
 if p_name is null or length(p_name) not between 2 and 80 or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Check your name and email'; end if;
 fingerprint:=sha256(convert_to(jsonb_build_array(tid,p_service,p_staff,p_start,p_name,p_email)::text,'UTF8'));
 token_digest:=sha256(decode(p_token,'hex'));
 select * into prior from private.booking_capabilities where token_hash=token_digest;
 if found then
  if prior.tenant_id<>tid or prior.request_hash<>fingerprint then raise exception 'This booking request has already been used'; end if;
  return prior.appointment_id;
 end if;
 -- Durable local-demo abuse limits, also enforced for direct RPC callers.
 if (select count(*) from public.appointments where tenant_id=tid and created_at>now()-interval '1 hour')>=60 or
 (select count(*) from public.customers where tenant_id=tid and email=p_email and created_at>now()-interval '1 hour')>=5 then raise exception 'Booking limit reached. Please contact the shop'; end if;
 select * into svc from public.services where tenant_id=tid and id=p_service;
 if p_quote is not null and (p_quote->>'price_minor' is distinct from svc.price_minor::text or p_quote->>'duration_minutes' is distinct from svc.duration_minutes::text) then raise exception 'The service details changed. Reload this page to review the latest price and duration'; end if;
 select * into slot from private.available_slots(tid,p_service,p_staff,(p_start at time zone 'Europe/Lisbon')::date) where starts_at=p_start;
 if not found then raise exception 'This time is no longer available. Please choose another'; end if;
 insert into public.customers(tenant_id,display_name,email) values(tid,p_name,p_email) returning id into cid;
 insert into public.appointments(tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until)
 select tid,l.id,cid,p_service,p_staff,svc.name,svc.price_minor,slot.starts_at,slot.ends_at,slot.blocked_until from public.locations l where l.tenant_id=tid returning id into aid;
 insert into private.booking_capabilities values(token_digest,tid,aid,fingerprint);
 return aid;
end $$;
create function public.create_booking(p_host text,p_service uuid,p_staff uuid,p_start timestamptz,p_name text,p_email text,p_token text,p_quote jsonb default null) returns uuid language sql set search_path='' as $$ select private.create_booking(p_host,p_service,p_staff,p_start,p_name,p_email,p_token,p_quote); $$;

revoke all on function private.create_booking(text,uuid,uuid,timestamptz,text,text,text,jsonb),public.create_booking(text,uuid,uuid,timestamptz,text,text,text,jsonb) from public;
grant execute on function private.create_booking(text,uuid,uuid,timestamptz,text,text,text,jsonb),public.create_booking(text,uuid,uuid,timestamptz,text,text,text,jsonb) to anon,authenticated;
