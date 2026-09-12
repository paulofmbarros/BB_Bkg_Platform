-- Phase 1: shared-schema tenancy. All seeded businesses are synthetic.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;

create type public.member_role as enum ('owner', 'manager', 'staff');
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  currency text not null default 'EUR' check (currency = 'EUR'),
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null,
  active boolean not null default true,
  primary key (tenant_id, user_id)
);
create index memberships_user_idx on public.tenant_memberships(user_id, tenant_id) where active;

-- Only this narrow membership lookup needs elevated privileges to avoid recursive RLS.
create function private.tenant_role(p_tenant uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select role from public.tenant_memberships
  where tenant_id = p_tenant and user_id = (select auth.uid()) and active
  and (select auth.uid()) is not null;
$$;
revoke all on function private.tenant_role(uuid) from public, anon;
grant execute on function private.tenant_role(uuid) to authenticated;

create table public.tenant_branding (
  tenant_id uuid primary key references public.tenants(id),
  tagline text not null default 'Good hair. Good company.' check (char_length(tagline) <= 120),
  description text not null default '' check (char_length(description) <= 500),
  accent_color text not null default '#254B3F' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  logo_path text check (logo_path is null or logo_path like tenant_id::text || '/%')
);
create table public.tenant_domains (
  hostname text primary key check (hostname = lower(hostname) and hostname ~ '^[a-z0-9.-]+$'),
  tenant_id uuid not null references public.tenants(id),
  verified_at timestamptz,
  is_primary boolean not null default false
);
create index domains_tenant_idx on public.tenant_domains(tenant_id);
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null default 'Main shop',
  address text not null default '',
  phone text not null default '',
  timezone text not null default 'Europe/Lisbon' check (timezone = 'Europe/Lisbon'),
  unique(tenant_id, id),
  unique(tenant_id) -- V0: one location, remove in a future multi-location migration.
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 240),
  category text not null default 'Hair' check (category in ('Hair','Beard','Rituals')),
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120),
  price_minor integer not null check (price_minor between 0 and 9999999),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id, id)
);
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  title text not null default 'Barber' check (char_length(title) between 2 and 100),
  bio text not null default '' check (char_length(bio) <= 240),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id, id),
  unique(tenant_id, user_id)
);
create table public.staff_services (
  tenant_id uuid not null,
  staff_id uuid not null,
  service_id uuid not null,
  primary key (tenant_id, staff_id, service_id),
  foreign key (tenant_id, staff_id) references public.staff_members(tenant_id,id) on delete cascade,
  foreign key (tenant_id, service_id) references public.services(tenant_id,id) on delete cascade
);
create index staff_services_service_idx on public.staff_services(tenant_id, service_id);
create table public.business_hours (
  tenant_id uuid not null,
  location_id uuid not null,
  weekday integer not null check (weekday between 0 and 6),
  enabled boolean not null default true,
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time,
  primary key (tenant_id, location_id, weekday),
  foreign key (tenant_id, location_id) references public.locations(tenant_id,id),
  check (start_time < end_time),
  check ((break_start is null and break_end is null) or (break_start is not null and break_end is not null and start_time <= break_start and break_start < break_end and break_end <= end_time))
);
create table public.staff_working_hours (
  tenant_id uuid not null,
  staff_id uuid not null,
  weekday integer not null check (weekday between 0 and 6),
  enabled boolean not null default true,
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time,
  primary key (tenant_id, staff_id, weekday),
  foreign key (tenant_id, staff_id) references public.staff_members(tenant_id,id) on delete cascade,
  check (start_time < end_time),
  check ((break_start is null and break_end is null) or (break_start is not null and break_end is not null and start_time <= break_start and break_start < break_end and break_end <= end_time))
);
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_id uuid not null,
  staff_id uuid,
  start_date date not null,
  end_date date not null,
  reason text not null check (char_length(reason) between 2 and 120),
  foreign key (tenant_id, location_id) references public.locations(tenant_id,id),
  foreign key (tenant_id, staff_id) references public.staff_members(tenant_id,id),
  check (end_date >= start_date)
);
create index exceptions_tenant_date_idx on public.availability_exceptions(tenant_id,start_date);
create index exceptions_staff_idx on public.availability_exceptions(tenant_id,staff_id);
create table public.feature_entitlements (
  tenant_id uuid not null references public.tenants(id),
  feature text not null,
  enabled boolean not null default false,
  primary key (tenant_id, feature)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id),
  actor_id uuid,
  operation text not null,
  entity_table text not null,
  entity_id text,
  occurred_at timestamptz not null default now()
);
create index audit_tenant_time_idx on public.audit_events(tenant_id, occurred_at desc);

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
create policy tenant_read on public.tenants for select to authenticated using (private.tenant_role(id) is not null);
create policy tenant_update on public.tenants for update to authenticated using (private.tenant_role(id) = 'owner') with check (private.tenant_role(id) = 'owner');
create policy own_memberships on public.tenant_memberships for select to authenticated using (user_id = (select auth.uid()) and active);
grant select on public.tenants, public.tenant_memberships to authenticated;
grant update(name) on public.tenants to authenticated;

-- No anonymous table access. Managers edit catalogue/schedules, owners edit branding.
do $$ declare t text; begin
  foreach t in array array['tenant_branding','tenant_domains','locations','services','staff_members','staff_services','business_hours','staff_working_hours','availability_exceptions','feature_entitlements','audit_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy member_read on public.%I for select to authenticated using (private.tenant_role(tenant_id) is not null)', t);
  end loop;
  foreach t in array array['services','staff_members','staff_services','business_hours','staff_working_hours','availability_exceptions'] loop
    execute format('grant insert, update, delete on public.%I to authenticated',t);
    execute format('create policy manager_insert on public.%I for insert to authenticated with check (private.tenant_role(tenant_id) in (''owner'',''manager''))',t);
    execute format('create policy manager_update on public.%I for update to authenticated using (private.tenant_role(tenant_id) in (''owner'',''manager'')) with check (private.tenant_role(tenant_id) in (''owner'',''manager''))',t);
    execute format('create policy manager_delete on public.%I for delete to authenticated using (private.tenant_role(tenant_id) in (''owner'',''manager''))',t);
  end loop;
  foreach t in array array['tenant_branding','locations'] loop
    execute format('grant update on public.%I to authenticated',t);
    execute format('create policy owner_update on public.%I for update to authenticated using (private.tenant_role(tenant_id) = ''owner'') with check (private.tenant_role(tenant_id) = ''owner'')',t);
  end loop;
end $$;
-- Staff cannot view membership administration, payment/feature configuration or audit records.
drop policy member_read on public.audit_events;
create policy owner_audit on public.audit_events for select to authenticated using(private.tenant_role(tenant_id) = 'owner');
drop policy member_read on public.feature_entitlements;
create policy management_features on public.feature_entitlements for select to authenticated using(private.tenant_role(tenant_id) in ('owner','manager'));
-- IDs and ownership are immutable through the API; staff user linking is provisioning-only.
revoke update on public.staff_members from authenticated;
grant update(display_name,title,bio,active) on public.staff_members to authenticated;
revoke update on public.services from authenticated;
grant update(name,description,category,duration_minutes,buffer_minutes,price_minor,active) on public.services to authenticated;
revoke update on public.tenant_branding from authenticated;
grant update(tagline,description,accent_color,logo_path) on public.tenant_branding to authenticated;
revoke update on public.locations from authenticated;
grant update(name,address,phone) on public.locations to authenticated;

create function private.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare data jsonb; tid uuid;
begin
  data := case when TG_OP = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  tid := case when TG_TABLE_NAME = 'tenants' then (data->>'id')::uuid else (data->>'tenant_id')::uuid end;
  insert into public.audit_events(tenant_id,actor_id,operation,entity_table,entity_id)
  values(tid,auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(data->>'id',data->>'staff_id',data->>'location_id',data->>'tenant_id'));
  return case when TG_OP = 'DELETE' then old else new end;
end $$;
revoke all on function private.audit_change() from public, anon, authenticated;
do $$ declare t text; begin
  foreach t in array array['tenants','tenant_branding','locations','services','staff_members','staff_services','business_hours','staff_working_hours','availability_exceptions','tenant_memberships'] loop
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  end loop;
end $$;

-- Invoker functions are atomic operations, never an RLS bypass.
create function public.save_hours(p_tenant uuid, p_subject uuid, p_staff boolean, p_rows jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if private.tenant_role(p_tenant) not in ('owner','manager') or private.tenant_role(p_tenant) is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if jsonb_array_length(p_rows) <> 7 or (select count(distinct (r->>'weekday')::int) from jsonb_array_elements(p_rows) r) <> 7 then raise exception 'Seven unique weekdays required'; end if;
  if p_staff then
    perform 1 from public.staff_members where tenant_id=p_tenant and id=p_subject for update;
    if not found then raise exception 'Staff not found'; end if;
    delete from public.staff_working_hours where tenant_id=p_tenant and staff_id=p_subject;
    insert into public.staff_working_hours select p_tenant,p_subject,x.* from jsonb_to_recordset(p_rows) as x(weekday int,enabled boolean,start_time time,end_time time,break_start time,break_end time);
  else
    perform 1 from public.locations where tenant_id=p_tenant and id=p_subject for update;
    if not found then raise exception 'Location not found'; end if;
    delete from public.business_hours where tenant_id=p_tenant and location_id=p_subject;
    insert into public.business_hours select p_tenant,p_subject,x.* from jsonb_to_recordset(p_rows) as x(weekday int,enabled boolean,start_time time,end_time time,break_start time,break_end time);
  end if;
end $$;
create function public.save_staff(p_tenant uuid,p_id uuid,p_name text,p_title text,p_bio text,p_active boolean,p_services uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare staff uuid;
begin
  if private.tenant_role(p_tenant) not in ('owner','manager') or private.tenant_role(p_tenant) is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_id is null then
    insert into public.staff_members(tenant_id,display_name,title,bio,active) values(p_tenant,p_name,p_title,p_bio,p_active) returning id into staff;
    insert into public.staff_working_hours select p_tenant,staff,weekday,enabled,start_time,end_time,break_start,break_end from public.business_hours where tenant_id=p_tenant;
  else
    update public.staff_members set display_name=p_name,title=p_title,bio=p_bio,active=p_active where tenant_id=p_tenant and id=p_id returning id into staff;
    if staff is null then raise exception 'Staff not found'; end if;
  end if;
  delete from public.staff_services where tenant_id=p_tenant and staff_id=staff;
  insert into public.staff_services select p_tenant,staff,unnest(p_services);
  return staff;
end $$;
create function public.save_branding(p_tenant uuid,p_name text,p_tagline text,p_description text,p_accent text,p_address text,p_phone text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if private.tenant_role(p_tenant) is distinct from 'owner' then raise exception 'Forbidden' using errcode='42501'; end if;
  update public.tenants set name=p_name where id=p_tenant;
  update public.tenant_branding set tagline=p_tagline,description=p_description,accent_color=p_accent where tenant_id=p_tenant;
  update public.locations set address=p_address,phone=p_phone where tenant_id=p_tenant;
end $$;
revoke all on function public.save_hours(uuid,uuid,boolean,jsonb), public.save_staff(uuid,uuid,text,text,text,boolean,uuid[]), public.save_branding(uuid,text,text,text,text,text,text) from public, anon;
grant execute on function public.save_hours(uuid,uuid,boolean,jsonb), public.save_staff(uuid,uuid,text,text,text,boolean,uuid[]), public.save_branding(uuid,text,text,text,text,text,text) to authenticated;

-- Deliberately anonymous, narrow public catalogue projection. No user or internal fields.
-- Hostname must exist in the verified domain registry; this cannot return tenant lists.
create function private.public_shop(p_hostname text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'name',t.name,'slug',t.slug,'is_demo',t.is_demo,'currency',t.currency,
    'tagline',b.tagline,'description',b.description,'accent_color',b.accent_color,'logo_path',b.logo_path,
    'address',l.address,'phone',l.phone,'timezone',l.timezone,
    'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'duration_minutes',s.duration_minutes,'price_minor',s.price_minor,'category',s.category) order by s.price_minor) from public.services s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'display_name',s.display_name,'title',s.title,'bio',s.bio) order by s.display_name) from public.staff_members s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',h.weekday,'enabled',h.enabled,'start_time',h.start_time,'end_time',h.end_time,'break_start',h.break_start,'break_end',h.break_end)) from public.business_hours h where h.tenant_id=t.id),'[]'::jsonb)
  ) from public.tenant_domains d join public.tenants t on t.id=d.tenant_id
  join public.tenant_branding b on b.tenant_id=t.id join public.locations l on l.tenant_id=t.id
  where d.hostname=p_hostname and d.verified_at is not null and t.active;
$$;
revoke all on function private.public_shop(text) from public;
grant execute on function private.public_shop(text) to anon,authenticated;
create function public.get_public_shop(p_hostname text) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.public_shop(p_hostname); $$;
revoke all on function public.get_public_shop(text) from public;
grant execute on function public.get_public_shop(text) to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('brand-assets','brand-assets',true,2097152,array['image/png','image/jpeg','image/webp']);
create policy branding_upload on storage.objects for insert to authenticated with check (
  bucket_id='brand-assets' and (storage.foldername(name))[1] in (select tenant_id::text from public.tenant_memberships where user_id=(select auth.uid()) and active and role='owner')
);
create policy branding_read on storage.objects for select to authenticated using (
  bucket_id='brand-assets' and (storage.foldername(name))[1] in (select tenant_id::text from public.tenant_memberships where user_id=(select auth.uid()) and active)
);
create policy branding_delete on storage.objects for delete to authenticated using (
  bucket_id='brand-assets' and (storage.foldername(name))[1] in (select tenant_id::text from public.tenant_memberships where user_id=(select auth.uid()) and active and role='owner')
);
