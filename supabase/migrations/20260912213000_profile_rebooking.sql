create table private.owner_booking_requests (
 tenant_id uuid not null references public.tenants(id),request_id uuid not null,
 fingerprint bytea not null,appointment_id uuid not null,
 primary key(tenant_id,request_id),
 foreign key(tenant_id,appointment_id) references public.appointments(tenant_id,id) on delete cascade
);
revoke all on private.owner_booking_requests from public,anon,authenticated;
create function private.rebook_customer(p_tenant uuid,p_customer uuid,p_customer_version integer,p_service uuid,p_staff uuid,p_start timestamptz,p_price integer,p_duration integer,p_request uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.customers%rowtype;s public.services%rowtype;slot record;prior private.owner_booking_requests%rowtype;fingerprint bytea;aid uuid;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) or not exists(select 1 from public.feature_entitlements where tenant_id=p_tenant and feature='booking' and enabled) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_request is null or p_start is null or p_customer is null or p_service is null or p_staff is null then raise exception 'Check the booking details'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
 fingerprint:=sha256(convert_to(jsonb_build_array(p_customer,p_service,p_staff,p_start,p_price,p_duration)::text,'UTF8'));
 select * into prior from private.owner_booking_requests where tenant_id=p_tenant and request_id=p_request;
 if found then
  if prior.fingerprint<>fingerprint then raise exception 'This booking request has already been used'; end if;
  return prior.appointment_id;
 end if;
 select * into c from public.customers where tenant_id=p_tenant and id=p_customer for share;
 if not found or c.linked_customer_id is not null then raise exception 'Open the retained customer profile before booking'; end if;
 if c.version is distinct from p_customer_version then raise exception 'Customer details changed. Reload before booking'; end if;
 select * into s from public.services where tenant_id=p_tenant and id=p_service and active;
 if not found then raise exception 'This service is no longer available'; end if;
 if p_price is distinct from s.price_minor or p_duration is distinct from s.duration_minutes then raise exception 'Service details changed. Reload to review the current price and duration'; end if;
 select * into slot from private.available_slots(p_tenant,p_service,p_staff,(p_start at time zone 'Europe/Lisbon')::date) where starts_at=p_start;
 if not found then raise exception 'This time is no longer available. Please choose another'; end if;
 insert into public.appointments(tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until)
 select p_tenant,l.id,c.id,s.id,p_staff,s.name,s.price_minor,slot.starts_at,slot.ends_at,slot.blocked_until from public.locations l where l.tenant_id=p_tenant returning id into aid;
 insert into private.owner_booking_requests values(p_tenant,p_request,fingerprint,aid);
 return aid;
end $$;
create function public.rebook_customer(p_tenant uuid,p_customer uuid,p_customer_version integer,p_service uuid,p_staff uuid,p_start timestamptz,p_price integer,p_duration integer,p_request uuid) returns uuid language sql set search_path='' as $$select private.rebook_customer(p_tenant,p_customer,p_customer_version,p_service,p_staff,p_start,p_price,p_duration,p_request);$$;
revoke all on function private.rebook_customer(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid),public.rebook_customer(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid) from public,anon,authenticated;
grant execute on function private.rebook_customer(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid),public.rebook_customer(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid) to authenticated;
