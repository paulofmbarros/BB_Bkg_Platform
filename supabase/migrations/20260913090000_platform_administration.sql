-- Platform access is provisioned by trusted administration, never user metadata.
create table private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true
);
revoke all on private.platform_admins from public, anon, authenticated;
create table private.platform_release (
  singleton boolean primary key default true check (singleton),
  live_booking_ready boolean not null default false
);
insert into private.platform_release default values;
revoke all on private.platform_release from public, anon, authenticated;

create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.platform_admins where user_id=auth.uid() and active);
$$;
create function public.is_platform_admin() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.is_platform_admin(); $$;
revoke all on function private.is_platform_admin(), public.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin(), public.is_platform_admin() to authenticated;

create table public.platform_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  email text not null check (email=lower(btrim(email)) and char_length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  cancelled_at timestamptz,
  delivery_state text not null default 'pending' check (delivery_state in ('pending','sending','sent','failed')),
  attempted_at timestamptz,
  sent_at timestamptz,
  attempt_id uuid,
  delivery_error text
);
create unique index one_pending_owner_invitation on public.platform_invitations(tenant_id, email) where accepted_at is null and cancelled_at is null;
alter table public.platform_invitations enable row level security;
revoke all on public.platform_invitations from public, anon, authenticated;
grant select on public.platform_invitations to authenticated;
grant all on public.platform_invitations to service_role;
create policy platform_invitation_read on public.platform_invitations for select to authenticated using (private.is_platform_admin());
create trigger audit_changes after insert or update or delete on public.platform_invitations for each row execute function private.audit_change();
alter table public.tenant_domains add column verification_token uuid not null default gen_random_uuid();

-- Suspending a business also blocks direct data API access with existing sessions.
create or replace function private.tenant_role(p_tenant uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.tenant_memberships m join public.tenants t on t.id=m.tenant_id
  where m.tenant_id=p_tenant and m.user_id=auth.uid() and m.active and t.active and auth.uid() is not null;
$$;

create function private.platform_clients(p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform access required' using errcode='42501'; end if;
  return jsonb_build_object('live_booking_ready', (select live_booking_ready from private.platform_release), 'clients', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',t.id,'slug',t.slug,'name',t.name,'active',t.active,'is_demo',t.is_demo,'created_at',t.created_at,
      'address',l.address,'phone',l.phone,
      'foundation',exists(select 1 from public.feature_entitlements e where e.tenant_id=t.id and feature='foundation' and enabled),
      'booking',exists(select 1 from public.feature_entitlements e where e.tenant_id=t.id and feature='booking' and enabled),
      'services',(select count(*) from public.services s where s.tenant_id=t.id and s.active),
      'staff',(select count(*) from public.staff_members s where s.tenant_id=t.id and s.active),
      'hours',(select count(*) from public.business_hours h where h.tenant_id=t.id and h.enabled),
      'domains',coalesce((select jsonb_agg(jsonb_build_object('hostname',d.hostname,'verified_at',d.verified_at,'verification_token',d.verification_token)) from public.tenant_domains d where d.tenant_id=t.id),'[]'::jsonb),
      'invitations',coalesce((select jsonb_agg(to_jsonb(i) - 'attempt_id' order by i.created_at desc) from public.platform_invitations i where i.tenant_id=t.id),'[]'::jsonb),
      'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'email',u.email,'role',m.role,'active',m.active)) from public.tenant_memberships m join auth.users u on u.id=m.user_id where m.tenant_id=t.id),'[]'::jsonb)
    ) order by t.created_at desc) from public.tenants t left join public.locations l on l.tenant_id=t.id where p_id is null or t.id=p_id
  ),'[]'::jsonb));
end $$;

create function private.platform_mutate(p_action text, p_tenant uuid, p_payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_name text; v_slug text; v_email text; v_hostname text; v_user uuid; v_active boolean;
begin
  if not private.is_platform_admin() then raise exception 'Platform access required' using errcode='42501'; end if;
  if p_action='create' then
    v_name:=btrim(p_payload->>'name'); v_slug:=p_payload->>'slug'; v_email:=lower(btrim(p_payload->>'email'));
    if char_length(v_slug)>63 or v_slug in ('admin','www','app','api','login','book','manage','workspace') then raise exception 'Choose another shop identifier'; end if;
    insert into public.tenants(name,slug) values(v_name,v_slug) returning id into v_id;
    insert into public.tenant_branding(tenant_id) values(v_id);
    if char_length(coalesce(p_payload->>'address',''))>240 or char_length(coalesce(p_payload->>'phone',''))>40 then raise exception 'Contact details too long'; end if;
    insert into public.locations(tenant_id,address,phone) values(v_id,coalesce(p_payload->>'address',''),coalesce(p_payload->>'phone',''));
    insert into public.business_hours(tenant_id,location_id,weekday,enabled,start_time,end_time)
      select v_id,l.id,d,false,'09:00','18:00' from public.locations l cross join generate_series(0,6) d where l.tenant_id=v_id;
    insert into public.feature_entitlements(tenant_id,feature,enabled) values(v_id,'foundation',true),(v_id,'booking',false);
    insert into public.platform_invitations(tenant_id,email,created_by) values(v_id,v_email,auth.uid());
  else
    perform 1 from public.tenants where id=p_tenant for update;
    if not found then raise exception 'Business unavailable'; end if;
    v_id:=p_tenant;
    case p_action
      when 'update' then
        if char_length(coalesce(p_payload->>'address',''))>240 or char_length(coalesce(p_payload->>'phone',''))>40 then raise exception 'Contact details too long'; end if;
        if (p_payload->>'booking')::boolean and not exists(select 1 from public.tenants where id=p_tenant and is_demo) and not (select live_booking_ready from private.platform_release) then
          raise exception 'Live booking release checks are not complete';
        end if;
        update public.tenants set name=btrim(p_payload->>'name'),active=(p_payload->>'active')::boolean where id=p_tenant;
        update public.locations set address=p_payload->>'address',phone=p_payload->>'phone' where tenant_id=p_tenant;
        insert into public.feature_entitlements(tenant_id,feature,enabled) values(p_tenant,'foundation',(p_payload->>'foundation')::boolean),(p_tenant,'booking',(p_payload->>'booking')::boolean)
          on conflict(tenant_id,feature) do update set enabled=excluded.enabled;
      when 'invite' then
        if not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Restore business access before inviting an owner'; end if;
        v_email:=lower(btrim(p_payload->>'email'));
        update public.platform_invitations set cancelled_at=now() where tenant_id=p_tenant and email=v_email and accepted_at is null and cancelled_at is null and expires_at<=now();
        insert into public.platform_invitations(tenant_id,email,created_by) values(p_tenant,v_email,auth.uid()) returning id into v_id;
      when 'cancel_invite' then
        update public.platform_invitations set cancelled_at=now() where tenant_id=p_tenant and id=(p_payload->>'id')::uuid and accepted_at is null and cancelled_at is null;
        if not found then raise exception 'Invitation is no longer pending'; end if;
      when 'membership' then
        v_user:=(p_payload->>'user_id')::uuid; v_active:=(p_payload->>'active')::boolean;
        if not v_active and exists(select 1 from public.tenant_memberships where tenant_id=p_tenant and user_id=v_user and role='owner' and active)
          and not exists(select 1 from public.tenant_memberships where tenant_id=p_tenant and user_id<>v_user and role='owner' and active) then
          raise exception 'Invite another owner before removing the last owner';
        end if;
        update public.tenant_memberships set active=v_active where tenant_id=p_tenant and user_id=v_user;
        if not found then raise exception 'Membership unavailable'; end if;
      when 'domain_add' then
        v_hostname:=p_payload->>'hostname';
        if char_length(v_hostname)>253 or v_hostname !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*$' then raise exception 'Enter a valid hostname'; end if;
        insert into public.tenant_domains(tenant_id,hostname) values(p_tenant,v_hostname);
      when 'domain_verify' then
        update public.tenant_domains set verified_at=now() where tenant_id=p_tenant and hostname=p_payload->>'hostname' and verification_token=(p_payload->>'token')::uuid;
        if not found then raise exception 'Domain unavailable'; end if;
      when 'domain_remove' then
        delete from public.tenant_domains where tenant_id=p_tenant and hostname=p_payload->>'hostname';
        if not found then raise exception 'Domain unavailable'; end if;
      else raise exception 'Unsupported platform action';
    end case;
  end if;
  insert into public.audit_events(tenant_id,actor_id,operation,entity_table,entity_id)
    values(case when p_action='create' then v_id else p_tenant end,auth.uid(),'platform_'||p_action,'platform',v_id::text);
  return v_id;
end $$;

create function private.accept_platform_invitation(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_inv public.platform_invitations; v_email text; v_slug text; v_tenant uuid;
begin
  select lower(email) into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if v_email is null then raise exception 'Sign in with the verified invited email' using errcode='42501'; end if;
  select tenant_id into v_tenant from public.platform_invitations where id=p_id;
  select slug into v_slug from public.tenants where id=v_tenant and active for update;
  if v_slug is null then raise exception 'Invitation unavailable'; end if;
  select * into v_inv from public.platform_invitations where id=p_id for update;
  if not found or v_inv.email<>v_email or v_inv.cancelled_at is not null or v_inv.expires_at<=now() then raise exception 'Invitation unavailable'; end if;
  -- A used invitation can never re-enable a subsequently revoked membership.
  if v_inv.accepted_at is not null then raise exception 'Invitation already accepted. Sign in to your workspace.'; end if;
  insert into public.tenant_memberships(tenant_id,user_id,role,active) values(v_inv.tenant_id,auth.uid(),'owner',true)
    on conflict(tenant_id,user_id) do update set role='owner',active=true;
  update public.platform_invitations set accepted_at=now() where id=p_id;
  insert into public.audit_events(tenant_id,actor_id,operation,entity_table,entity_id) values(v_inv.tenant_id,auth.uid(),'owner_invitation_accepted','tenant_memberships',auth.uid()::text);
  return v_slug;
end $$;

-- Claim delivery atomically. Only the Edge Function's privileged client can claim.
create function private.claim_platform_invitation(p_id uuid, p_actor uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_inv public.platform_invitations;
begin
  if not exists(select 1 from private.platform_admins where user_id=p_actor and active) then raise exception 'Platform access required'; end if;
  update public.platform_invitations set delivery_state='sending',attempted_at=now(),attempt_id=gen_random_uuid(),delivery_error=null
    where id=p_id and accepted_at is null and cancelled_at is null and expires_at>now()
      and (attempted_at is null or attempted_at<now()-interval '2 minutes')
      and exists(select 1 from public.tenants where id=tenant_id and active)
    returning * into v_inv;
  if not found then raise exception 'Invitation unavailable or recently sent'; end if;
  return to_jsonb(v_inv);
end $$;

create function public.platform_clients(p_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$ select private.platform_clients(p_id); $$;
create function public.platform_mutate(p_action text,p_tenant uuid,p_payload jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.platform_mutate(p_action,p_tenant,p_payload); $$;
create function public.accept_platform_invitation(p_id uuid) returns text language sql security invoker set search_path='' as $$ select private.accept_platform_invitation(p_id); $$;
create function public.claim_platform_invitation(p_id uuid,p_actor uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.claim_platform_invitation(p_id,p_actor); $$;

revoke all on function private.platform_clients(uuid),public.platform_clients(uuid),private.platform_mutate(text,uuid,jsonb),public.platform_mutate(text,uuid,jsonb),private.accept_platform_invitation(uuid),public.accept_platform_invitation(uuid),private.claim_platform_invitation(uuid,uuid),public.claim_platform_invitation(uuid,uuid) from public,anon,authenticated;
grant execute on function private.platform_clients(uuid),public.platform_clients(uuid),private.platform_mutate(text,uuid,jsonb),public.platform_mutate(text,uuid,jsonb),private.accept_platform_invitation(uuid),public.accept_platform_invitation(uuid) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_platform_invitation(uuid,uuid),public.claim_platform_invitation(uuid,uuid) to service_role;
