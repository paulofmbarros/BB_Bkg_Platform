-- Phase 2: authoritative scheduling and capability-scoped guest access.
create extension if not exists btree_gist with schema extensions;

create table public.customers (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 display_name text not null check (length(display_name) between 2 and 80),
 email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 email_verified boolean not null default false,
 marketing_consent boolean not null default false,
 created_at timestamptz not null default now(),
 unique(tenant_id,id)
);
-- Unverified email addresses are intentionally not used to merge identities.
create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 location_id uuid not null,
 customer_id uuid not null,
 service_id uuid not null,
 staff_id uuid not null,
 service_name text not null,
 price_minor integer not null check (price_minor >= 0),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 blocked_until timestamptz not null,
 status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key (tenant_id,location_id) references public.locations(tenant_id,id),
 foreign key (tenant_id,customer_id) references public.customers(tenant_id,id),
 foreign key (tenant_id,service_id) references public.services(tenant_id,id),
 foreign key (tenant_id,staff_id) references public.staff_members(tenant_id,id),
 check (starts_at < ends_at and ends_at <= blocked_until),
 exclude using gist (tenant_id with =, staff_id with =, tstzrange(starts_at,blocked_until,'[)') with &&) where (status <> 'cancelled')
);
create index appointments_tenant_date_idx on public.appointments(tenant_id,starts_at);
create index appointments_customer_idx on public.appointments(tenant_id,customer_id);
create index appointments_service_idx on public.appointments(tenant_id,service_id);
create index appointments_location_idx on public.appointments(tenant_id,location_id);
create index customers_email_idx on public.customers(tenant_id,email,created_at);
create table private.booking_capabilities (
 token_hash bytea primary key,
 tenant_id uuid not null,
 appointment_id uuid not null unique,
 request_hash bytea not null,
 foreign key (tenant_id,appointment_id) references public.appointments(tenant_id,id) on delete cascade
);
revoke all on private.booking_capabilities from public, anon, authenticated;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
revoke all on public.customers, public.appointments from anon, authenticated;
grant select on public.customers, public.appointments to authenticated;
create policy appointment_read on public.appointments for select to authenticated using (
 private.tenant_role(tenant_id) in ('owner','manager') or
 (private.tenant_role(tenant_id)='staff' and exists(select 1 from public.staff_members s where s.tenant_id=appointments.tenant_id and s.id=appointments.staff_id and s.user_id=(select auth.uid())))
);
create policy customer_read on public.customers for select to authenticated using (
 private.tenant_role(tenant_id) in ('owner','manager') or exists(select 1 from public.appointments a where a.tenant_id=customers.tenant_id and a.customer_id=customers.id)
);
create trigger audit_changes after insert or update or delete on public.appointments for each row execute function private.audit_change();
create trigger audit_changes after insert or update or delete on public.customers for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.appointments for each row execute function private.prevent_tenant_move();
create trigger immutable_tenant before update on public.customers for each row execute function private.prevent_tenant_move();

-- One transaction lock per tenant serializes configuration and booking decisions.
create function private.lock_schedule() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(new.tenant_id,old.tenant_id)::text, 7202));
 return coalesce(new,old);
end $$;
revoke all on function private.lock_schedule() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['business_hours','staff_working_hours','availability_exceptions','services','staff_members','staff_services','locations','feature_entitlements'] loop
 execute format('create trigger booking_schedule_lock before insert or update or delete on public.%I for each row execute function private.lock_schedule()',t);
 end loop;
end $$;

create function private.booking_tenant(p_host text) returns uuid language sql stable security definer set search_path='' as $$
 select t.id from public.tenants t join public.tenant_domains d on d.tenant_id=t.id
 where d.hostname=p_host and d.verified_at is not null and t.active
 and exists(select 1 from public.feature_entitlements e where e.tenant_id=t.id and e.feature='booking' and e.enabled);
$$;
revoke all on function private.booking_tenant(text) from public,anon,authenticated;

-- Generate UTC instants, then test local wall times: missing DST times never appear,
-- repeated times remain distinct instants. Include buffer in hours/break checks.
create function private.available_slots(p_tenant uuid,p_service uuid,p_staff uuid,p_day date,p_ignore uuid default null)
returns table(starts_at timestamptz, ends_at timestamptz, blocked_until timestamptz)
language sql stable set search_path='' as $$
 select g.instant, g.instant + make_interval(mins=>s.duration_minutes),
 g.instant + make_interval(mins=>s.duration_minutes+s.buffer_minutes)
 from public.services s
 join public.staff_services ss on ss.tenant_id=s.tenant_id and ss.service_id=s.id and ss.staff_id=p_staff
 join public.staff_members m on m.tenant_id=ss.tenant_id and m.id=ss.staff_id and m.active
 join public.locations l on l.tenant_id=s.tenant_id
 join public.business_hours b on b.tenant_id=s.tenant_id and b.location_id=l.id and b.weekday=extract(dow from p_day)::int and b.enabled
 join public.staff_working_hours h on h.tenant_id=s.tenant_id and h.staff_id=p_staff and h.weekday=b.weekday and h.enabled
 cross join lateral generate_series(p_day::timestamp at time zone l.timezone, (p_day+1)::timestamp at time zone l.timezone - interval '1 minute', interval '15 minutes') g(instant)
 cross join lateral (select g.instant at time zone l.timezone as local_start,
 (g.instant+make_interval(mins=>s.duration_minutes+s.buffer_minutes)) at time zone l.timezone as local_end) x
 where s.tenant_id=p_tenant and s.id=p_service and s.active
 and p_day between (now() at time zone l.timezone)::date and (now() at time zone l.timezone)::date+90
 and g.instant >= now()+interval '30 minutes'
 and x.local_start >= p_day+greatest(b.start_time,h.start_time)
 and x.local_end <= p_day+least(b.end_time,h.end_time)
 -- Reject an interval crossing a DST offset transition; its wall-time span is ambiguous.
 and x.local_end-x.local_start = make_interval(mins=>s.duration_minutes+s.buffer_minutes)
 and (b.break_start is null or x.local_end<=p_day+b.break_start or x.local_start>=p_day+b.break_end)
 and (h.break_start is null or x.local_end<=p_day+h.break_start or x.local_start>=p_day+h.break_end)
 and not exists(select 1 from public.availability_exceptions e where e.tenant_id=p_tenant and e.location_id=l.id and (e.staff_id is null or e.staff_id=p_staff) and p_day between e.start_date and e.end_date)
 and not exists(select 1 from public.appointments a where a.tenant_id=p_tenant and a.staff_id=p_staff and a.status<>'cancelled' and (p_ignore is null or a.id<>p_ignore) and tstzrange(a.starts_at,a.blocked_until,'[)') && tstzrange(g.instant,g.instant+make_interval(mins=>s.duration_minutes+s.buffer_minutes),'[)'))
 order by g.instant;
$$;
revoke all on function private.available_slots(uuid,uuid,uuid,date,uuid) from public,anon,authenticated;

create function private.guest_slots(p_host text,p_service uuid,p_staff uuid,p_day date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tid uuid; result jsonb;
begin
 tid:=private.booking_tenant(p_host);
 if tid is null then return '[]'::jsonb; end if;
 select coalesce(jsonb_agg(jsonb_build_object('starts_at',s.starts_at,'ends_at',s.ends_at)),'[]'::jsonb) into result from private.available_slots(tid,p_service,p_staff,p_day) s;
 return result;
end $$;
create function public.booking_slots(p_host text,p_service uuid,p_staff uuid,p_day date) returns jsonb language sql set search_path='' as $$ select private.guest_slots(p_host,p_service,p_staff,p_day); $$;

create function private.create_booking(p_host text,p_service uuid,p_staff uuid,p_start timestamptz,p_name text,p_email text,p_token text) returns uuid
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
 select * into slot from private.available_slots(tid,p_service,p_staff,(p_start at time zone 'Europe/Lisbon')::date) where starts_at=p_start;
 if not found then raise exception 'This time is no longer available. Please choose another'; end if;
 insert into public.customers(tenant_id,display_name,email) values(tid,p_name,p_email) returning id into cid;
 insert into public.appointments(tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until)
 select tid,l.id,cid,p_service,p_staff,svc.name,svc.price_minor,slot.starts_at,slot.ends_at,slot.blocked_until from public.locations l where l.tenant_id=tid returning id into aid;
 insert into private.booking_capabilities values(token_digest,tid,aid,fingerprint);
 return aid;
end $$;
create function public.create_booking(p_host text,p_service uuid,p_staff uuid,p_start timestamptz,p_name text,p_email text,p_token text) returns uuid language sql set search_path='' as $$ select private.create_booking(p_host,p_service,p_staff,p_start,p_name,p_email,p_token); $$;

create function private.change_booking(p_tenant uuid,p_id uuid,p_version integer,p_action text,p_start timestamptz default null) returns void
language plpgsql set search_path='' as $$
declare a public.appointments%rowtype; slot record;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
 select * into a from public.appointments where tenant_id=p_tenant and id=p_id for update;
 if not found or p_version is distinct from a.version then raise exception 'This appointment changed. Reload and try again'; end if;
 if a.status<>'confirmed' then raise exception 'Only confirmed appointments can be changed'; end if;
 if p_action in ('cancel','reschedule') and a.starts_at<=now() then raise exception 'This appointment has already started'; end if;
 if p_action='cancel' then
  update public.appointments set status='cancelled',version=version+1,updated_at=now() where id=a.id;
 elsif p_action='reschedule' then
  select * into slot from private.available_slots(p_tenant,a.service_id,a.staff_id,(p_start at time zone 'Europe/Lisbon')::date,a.id) where starts_at=p_start;
  if not found then raise exception 'This time is no longer available. Please choose another'; end if;
  -- Keep the agreed service duration, buffer and price on rescheduling.
  if slot.ends_at-slot.starts_at<>a.ends_at-a.starts_at or slot.blocked_until-slot.ends_at<>a.blocked_until-a.ends_at then raise exception 'Service duration changed. Please contact the shop'; end if;
  update public.appointments set starts_at=slot.starts_at,ends_at=slot.ends_at,blocked_until=slot.blocked_until,version=version+1,updated_at=now() where id=a.id;
 elsif p_action='complete' and a.ends_at<=now() then
  update public.appointments set status='completed',version=version+1,updated_at=now() where id=a.id;
 elsif p_action='no_show' and a.starts_at<=now() then
  update public.appointments set status='no_show',version=version+1,updated_at=now() where id=a.id;
 else raise exception 'This action is not available'; end if;
end $$;
revoke all on function private.change_booking(uuid,uuid,integer,text,timestamptz) from public,anon,authenticated;

create function private.manage_booking(p_host text,p_token text,p_action text default 'view',p_version integer default null,p_start timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tid uuid; aid uuid; result jsonb;
begin
 tid:=private.booking_tenant(p_host);
 if tid is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Booking not found'; end if;
 select appointment_id into aid from private.booking_capabilities where tenant_id=tid and token_hash=sha256(decode(p_token,'hex'));
 if aid is null then raise exception 'Booking not found'; end if;
 if p_action not in ('view','cancel','reschedule') or p_action is null then raise exception 'Invalid action'; end if;
 if p_action<>'view' then perform private.change_booking(tid,aid,p_version,p_action,p_start); end if;
 select jsonb_build_object('id',a.id,'service_id',a.service_id,'staff_id',a.staff_id,'service_name',a.service_name,'barber',s.display_name,'customer_name',c.display_name,'price_minor',a.price_minor,'starts_at',a.starts_at,'ends_at',a.ends_at,'status',a.status,'version',a.version)
 into result from public.appointments a join public.staff_members s on s.tenant_id=a.tenant_id and s.id=a.staff_id join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id where a.id=aid and a.tenant_id=tid;
 return result;
end $$;
create function public.manage_booking(p_host text,p_token text,p_action text default 'view',p_version integer default null,p_start timestamptz default null) returns jsonb language sql set search_path='' as $$ select private.manage_booking(p_host,p_token,p_action,p_version,p_start); $$;

create function private.owner_booking_change(p_tenant uuid,p_id uuid,p_version integer,p_action text,p_start timestamptz default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) or not exists(select 1 from public.feature_entitlements where tenant_id=p_tenant and feature='booking' and enabled) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform private.change_booking(p_tenant,p_id,p_version,p_action,p_start);
end $$;
create function public.owner_booking_change(p_tenant uuid,p_id uuid,p_version integer,p_action text,p_start timestamptz default null) returns void language sql set search_path='' as $$ select private.owner_booking_change(p_tenant,p_id,p_version,p_action,p_start); $$;

do $$ declare fn regprocedure; begin
 for fn in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') and p.proname in ('guest_slots','booking_slots','create_booking','manage_booking','owner_booking_change') loop
 execute format('revoke all on function %s from public,anon,authenticated',fn);
 if fn::text like '%owner_booking_change%' then execute format('grant execute on function %s to authenticated',fn);
 else execute format('grant execute on function %s to anon,authenticated',fn); end if;
 end loop;
end $$;
-- Only synthetic tenants opt in initially.
insert into public.feature_entitlements(tenant_id,feature,enabled) select id,'booking',true from public.tenants where is_demo on conflict do nothing;
