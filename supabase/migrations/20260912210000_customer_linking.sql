alter table public.customers add column linked_customer_id uuid;
alter table public.customers add constraint customer_link_tenant_fk foreign key(tenant_id,linked_customer_id) references public.customers(tenant_id,id);
alter table public.customers add constraint customer_no_self_link check(id<>linked_customer_id);
create index customer_link_target_idx on public.customers(tenant_id,linked_customer_id);
create table public.customer_links (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 source_id uuid not null,target_id uuid not null,appointment_ids uuid[] not null,
 confirmation text not null check(confirmation in ('customer_confirmed','records_reviewed')),
 actor_id uuid not null,created_at timestamptz not null default now(),undone_at timestamptz,undone_by uuid,
 foreign key(tenant_id,source_id) references public.customers(tenant_id,id),
 foreign key(tenant_id,target_id) references public.customers(tenant_id,id),check(source_id<>target_id)
);
create unique index customer_one_active_link on public.customer_links(source_id) where undone_at is null;
create index customer_links_target_idx on public.customer_links(tenant_id,target_id);
create index customer_links_source_idx on public.customer_links(tenant_id,source_id);
alter table public.customer_links enable row level security;
revoke all on public.customer_links from public,anon,authenticated;
grant select on public.customer_links to authenticated;
create policy manager_read on public.customer_links for select to authenticated using(private.tenant_role(tenant_id) in ('owner','manager'));
create trigger audit_changes after insert or update on public.customer_links for each row execute function private.audit_change();

-- Preserve the guest's original name; linking must not expose the retained profile's details.
alter table private.booking_capabilities add column guest_name text;
update private.booking_capabilities cap set guest_name=c.display_name from public.appointments a join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id where cap.appointment_id=a.id;
create function private.capture_guest_name() returns trigger language plpgsql set search_path='' as $$
begin
 select c.display_name into new.guest_name from public.appointments a join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id where a.id=new.appointment_id and a.tenant_id=new.tenant_id;
 return new;
end $$;
revoke all on function private.capture_guest_name() from public,anon,authenticated;
create trigger capture_guest_name before insert on private.booking_capabilities for each row execute function private.capture_guest_name();

create function private.customer_history_revision(p_tenant uuid,p_customer uuid) returns text language sql stable set search_path='' as $$
 select encode(sha256(convert_to(coalesce(string_agg(a.id::text||':'||a.version::text,',' order by a.id),''),'UTF8')),'hex') from public.appointments a where a.tenant_id=p_tenant and a.customer_id=p_customer;
$$;
revoke all on function private.customer_history_revision(uuid,uuid) from public,anon,authenticated;

create function private.link_customers(p_tenant uuid,p_source uuid,p_target uuid,p_source_version integer,p_target_version integer,p_source_revision text,p_target_revision text,p_confirmation text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s public.customers%rowtype;t public.customers%rowtype;ids uuid[];link_id uuid;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_source is null or p_target is null or p_source=p_target or p_confirmation is null or p_confirmation not in ('customer_confirmed','records_reviewed') then raise exception 'Confirm two distinct customer records'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
 perform 1 from public.customers where tenant_id=p_tenant and id in(p_source,p_target) order by id for update;
 select * into s from public.customers where tenant_id=p_tenant and id=p_source;
 select * into t from public.customers where tenant_id=p_tenant and id=p_target;
 if s.id is null or t.id is null or s.linked_customer_id is not null or t.linked_customer_id is not null then raise exception 'These records are no longer available for linking'; end if;
 if s.version is distinct from p_source_version or t.version is distinct from p_target_version or private.customer_history_revision(p_tenant,p_source) is distinct from p_source_revision or private.customer_history_revision(p_tenant,p_target) is distinct from p_target_revision then raise exception 'These profiles or appointments changed. Reload the review before linking'; end if;
 if exists(select 1 from public.customer_links where tenant_id=p_tenant and target_id=p_source and undone_at is null) then raise exception 'Undo the incoming links on this profile before linking it elsewhere'; end if;
 select coalesce(array_agg(id),'{}'::uuid[]) into ids from public.appointments where tenant_id=p_tenant and customer_id=p_source;
 insert into public.customer_links(tenant_id,source_id,target_id,appointment_ids,confirmation,actor_id) values(p_tenant,p_source,p_target,ids,p_confirmation,auth.uid()) returning id into link_id;
 update public.appointments set customer_id=p_target,version=version+1,updated_at=now() where tenant_id=p_tenant and customer_id=p_source;
 update public.customers set linked_customer_id=p_target,version=version+1,updated_at=now() where tenant_id=p_tenant and id=p_source;
 update public.customers set version=version+1,updated_at=now() where tenant_id=p_tenant and id=p_target;
 return link_id;
end $$;
create function public.link_customers(p_tenant uuid,p_source uuid,p_target uuid,p_source_version integer,p_target_version integer,p_source_revision text,p_target_revision text,p_confirmation text) returns uuid language sql set search_path='' as $$select private.link_customers(p_tenant,p_source,p_target,p_source_version,p_target_version,p_source_revision,p_target_revision,p_confirmation);$$;

create function private.undo_customer_link(p_tenant uuid,p_link uuid) returns void language plpgsql security definer set search_path='' as $$
declare l public.customer_links%rowtype;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
 select * into l from public.customer_links where tenant_id=p_tenant and id=p_link for update;
 if not found or l.undone_at is not null then raise exception 'This link is no longer active'; end if;
 perform 1 from public.customers where tenant_id=p_tenant and id in(l.source_id,l.target_id) order by id for update;
 if not exists(select 1 from public.customers where tenant_id=p_tenant and id=l.source_id and linked_customer_id=l.target_id) or (select count(*) from public.appointments where tenant_id=p_tenant and id=any(l.appointment_ids) and customer_id=l.target_id)<>cardinality(l.appointment_ids) then raise exception 'Linked records changed. This link needs an administrator review'; end if;
 update public.appointments set customer_id=l.source_id,version=version+1,updated_at=now() where tenant_id=p_tenant and id=any(l.appointment_ids);
 update public.customers set linked_customer_id=null,version=version+1,updated_at=now() where tenant_id=p_tenant and id=l.source_id;
 update public.customers set version=version+1,updated_at=now() where tenant_id=p_tenant and id=l.target_id;
 update public.customer_links set undone_at=now(),undone_by=auth.uid() where id=l.id;
end $$;
create function public.undo_customer_link(p_tenant uuid,p_link uuid) returns void language sql set search_path='' as $$select private.undo_customer_link(p_tenant,p_link);$$;
revoke all on function private.link_customers(uuid,uuid,uuid,integer,integer,text,text,text),public.link_customers(uuid,uuid,uuid,integer,integer,text,text,text),private.undo_customer_link(uuid,uuid),public.undo_customer_link(uuid,uuid) from public,anon,authenticated;
grant execute on function private.link_customers(uuid,uuid,uuid,integer,integer,text,text,text),public.link_customers(uuid,uuid,uuid,integer,integer,text,text,text),private.undo_customer_link(uuid,uuid),public.undo_customer_link(uuid,uuid) to authenticated;

create or replace view public.customer_summaries with (security_invoker=true) as
 select c.id,c.tenant_id,c.display_name,c.email,c.email_verified,c.marketing_consent,c.created_at,c.updated_at,c.version,
 lower(c.display_name||' '||c.email) as search_text,
 count(a.id)::integer as appointment_count,
 count(a.id) filter(where a.status='completed')::integer as completed_visits,
 count(a.id) filter(where a.status='cancelled')::integer as cancellations,
 count(a.id) filter(where a.status='no_show')::integer as no_shows,
 count(a.id) filter(where a.status='confirmed' and a.starts_at>now())::integer as upcoming_visits,
 count(a.id) filter(where a.status='confirmed' and a.starts_at<=now())::integer as awaiting_outcome,
 coalesce(sum(a.price_minor) filter(where a.status='completed'),0)::bigint as completed_value_minor,
 coalesce(round(avg(a.price_minor) filter(where a.status='completed')),0)::bigint as average_visit_minor,
 max(a.starts_at) filter(where a.status='completed') as last_visit_at,
 min(a.starts_at) filter(where a.status='confirmed' and a.starts_at>now()) as next_visit_at,
 encode(sha256(convert_to(coalesce(string_agg(a.id::text||':'||a.version::text,',' order by a.id),''),'UTF8')),'hex') as history_revision
 from public.customers c left join public.appointments a on a.tenant_id=c.tenant_id and a.customer_id=c.id
 where c.linked_customer_id is null
 group by c.id;

create or replace function private.update_customer(p_tenant uuid,p_id uuid,p_version integer,p_name text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.customers%rowtype;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into c from public.customers where tenant_id=p_tenant and id=p_id for update;
 if c.linked_customer_id is not null then raise exception 'Open the retained profile to edit customer details'; end if;
 if not found or p_version is distinct from c.version then raise exception 'This profile changed. Reload and try again'; end if;
 p_name:=btrim(p_name);p_email:=lower(btrim(p_email));
 if p_name is null or length(p_name) not between 2 and 80 or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Check the name and email address'; end if;
 update public.customers set display_name=p_name,email=p_email,email_verified=case when email=p_email then email_verified else false end,version=version+1,updated_at=now() where id=c.id and tenant_id=p_tenant;
end $$;

create or replace function private.manage_booking(p_host text,p_token text,p_action text default 'view',p_version integer default null,p_start timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tid uuid; aid uuid; result jsonb;
begin
 tid:=private.booking_tenant(p_host);
 if tid is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Booking not found'; end if;
 select appointment_id into aid from private.booking_capabilities where tenant_id=tid and token_hash=sha256(decode(p_token,'hex'));
 if aid is null then raise exception 'Booking not found'; end if;
 if p_action not in ('view','cancel','reschedule') or p_action is null then raise exception 'Invalid action'; end if;
 if p_action<>'view' then perform private.change_booking(tid,aid,p_version,p_action,p_start); end if;
 select jsonb_build_object('id',a.id,'service_id',a.service_id,'staff_id',a.staff_id,'service_name',a.service_name,'barber',s.display_name,'customer_name',(select guest_name from private.booking_capabilities where appointment_id=aid and tenant_id=tid),'price_minor',a.price_minor,'starts_at',a.starts_at,'ends_at',a.ends_at,'status',a.status,'version',a.version)
 into result from public.appointments a join public.staff_members s on s.tenant_id=a.tenant_id and s.id=a.staff_id join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id where a.id=aid and a.tenant_id=tid;
 return result;
end $$;
