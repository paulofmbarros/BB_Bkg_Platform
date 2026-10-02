-- Phase 4, first increment: consent-aware waitlists and attributable
-- cancellation recovery. Noma records owner outreach but does not send it.

create table public.waitlist_entries (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 customer_id uuid not null,
 service_id uuid not null,
 preferred_staff_id uuid,
 earliest_date date not null,
 latest_date date not null,
 status text not null default 'waiting' check(status in ('waiting','booked','closed')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 closed_at timestamptz,
 unique(tenant_id,id),
 foreign key(tenant_id,customer_id) references public.customers(tenant_id,id),
 foreign key(tenant_id,service_id) references public.services(tenant_id,id),
 foreign key(tenant_id,preferred_staff_id) references public.staff_members(tenant_id,id),
 check(earliest_date<=latest_date),
 check((status='waiting' and closed_at is null) or (status<>'waiting' and closed_at is not null))
);
create unique index one_active_waitlist_preference
 on public.waitlist_entries(tenant_id,customer_id,service_id,coalesce(preferred_staff_id,'00000000-0000-0000-0000-000000000000'::uuid))
 where status='waiting';
create index waitlist_entries_tenant_status_idx on public.waitlist_entries(tenant_id,status,earliest_date,latest_date);
alter table public.waitlist_entries enable row level security;
revoke all on public.waitlist_entries from public,anon,authenticated;
grant select on public.waitlist_entries to authenticated;
create policy manager_waitlist_read on public.waitlist_entries for select to authenticated
 using(private.tenant_role(tenant_id) in ('owner','manager'));
create trigger audit_changes after insert or update or delete on public.waitlist_entries
 for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.waitlist_entries
 for each row execute function private.prevent_tenant_move();

create table public.waitlist_recovery_actions (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 waitlist_entry_id uuid not null,
 source_appointment_id uuid not null,
 consent_event_id uuid not null,
 channel text not null check(channel='email'),
 message text not null check(length(message) between 1 and 600),
 contacted_by uuid not null default auth.uid() references auth.users(id),
 contacted_at timestamptz not null default now(),
 attributed_appointment_id uuid,
 attributed_at timestamptz,
 unique(tenant_id,id),
 unique(tenant_id,waitlist_entry_id,source_appointment_id),
 foreign key(tenant_id,waitlist_entry_id) references public.waitlist_entries(tenant_id,id),
 foreign key(tenant_id,source_appointment_id) references public.appointments(tenant_id,id),
 foreign key(tenant_id,consent_event_id) references public.customer_consent_events(tenant_id,id),
 foreign key(tenant_id,attributed_appointment_id) references public.appointments(tenant_id,id),
 check((attributed_appointment_id is null and attributed_at is null) or (attributed_appointment_id is not null and attributed_at is not null))
);
create index waitlist_recovery_actions_tenant_time_idx on public.waitlist_recovery_actions(tenant_id,contacted_at desc);
alter table public.waitlist_recovery_actions enable row level security;
revoke all on public.waitlist_recovery_actions from public,anon,authenticated;
grant select on public.waitlist_recovery_actions to authenticated;
create policy manager_recovery_action_read on public.waitlist_recovery_actions for select to authenticated
 using(private.tenant_role(tenant_id) in ('owner','manager'));
create trigger audit_changes after insert or update or delete on public.waitlist_recovery_actions
 for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.waitlist_recovery_actions
 for each row execute function private.prevent_tenant_move();

create function private.create_waitlist_entry(p_tenant uuid,p_customer uuid,p_service uuid,p_staff uuid,p_earliest date,p_latest date) returns uuid
language plpgsql security definer set search_path='' as $$
declare entry_id uuid; local_today date;
begin
 if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
 local_today:=(now() at time zone 'Europe/Lisbon')::date;
 if p_earliest is null or p_latest is null or p_earliest<local_today or p_latest<p_earliest or p_latest>local_today+90 then
  raise exception 'Choose a date window within the next 90 days';
 end if;
 if not exists(select 1 from public.customers c where c.tenant_id=p_tenant and c.id=p_customer and c.linked_customer_id is null and c.marketing_consent) or
    not exists(select 1 from public.customer_consent_events e where e.tenant_id=p_tenant and e.customer_id=p_customer and e.marketing_consent) then
  raise exception 'Record the customer email consent before adding them to the waitlist';
 end if;
 if not exists(select 1 from public.services s where s.tenant_id=p_tenant and s.id=p_service and s.active) then raise exception 'This service is unavailable'; end if;
 if p_staff is not null and not exists(
  select 1 from public.staff_members m join public.staff_services ss on ss.tenant_id=m.tenant_id and ss.staff_id=m.id
  where m.tenant_id=p_tenant and m.id=p_staff and m.active and ss.service_id=p_service
 ) then raise exception 'This team member is unavailable for the selected service'; end if;
 insert into public.waitlist_entries(tenant_id,customer_id,service_id,preferred_staff_id,earliest_date,latest_date)
 values(p_tenant,p_customer,p_service,p_staff,p_earliest,p_latest) returning id into entry_id;
 return entry_id;
exception when unique_violation then raise exception 'This customer already has the same active waitlist request';
end $$;
create function public.create_waitlist_entry(p_tenant uuid,p_customer uuid,p_service uuid,p_staff uuid,p_earliest date,p_latest date) returns uuid
language sql set search_path='' as $$select private.create_waitlist_entry(p_tenant,p_customer,p_service,p_staff,p_earliest,p_latest);$$;

create function private.close_waitlist_entry(p_tenant uuid,p_entry uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
 update public.waitlist_entries set status='closed',closed_at=now()
 where tenant_id=p_tenant and id=p_entry and status='waiting';
 if not found then raise exception 'This waitlist request is no longer active'; end if;
end $$;
create function public.close_waitlist_entry(p_tenant uuid,p_entry uuid) returns void
language sql set search_path='' as $$select private.close_waitlist_entry(p_tenant,p_entry);$$;

-- Every row explains one exact match. A slot disappears as soon as another
-- non-cancelled appointment occupies any part of the released interval.
create view public.revenue_recovery_opportunities with(security_invoker=true) as
select
 w.tenant_id,w.id as waitlist_entry_id,w.customer_id,c.display_name as customer_name,c.email as customer_email,
 w.service_id,s.name as service_name,s.price_minor,w.preferred_staff_id,
 a.staff_id,m.display_name as staff_name,a.id as source_appointment_id,a.starts_at,a.ends_at,a.blocked_until,
 w.earliest_date,w.latest_date,a.updated_at as cancelled_at,
 x.id as recovery_action_id,x.contacted_at,x.attributed_appointment_id,
 case when w.preferred_staff_id is null then 'Service and date window match; any team member accepted'
      else 'Service, preferred team member and date window match' end as match_reason
from public.waitlist_entries w
join public.customers c on c.tenant_id=w.tenant_id and c.id=w.customer_id
join public.services s on s.tenant_id=w.tenant_id and s.id=w.service_id
join public.appointments a on a.tenant_id=w.tenant_id and a.service_id=w.service_id and a.status='cancelled'
join public.staff_members m on m.tenant_id=a.tenant_id and m.id=a.staff_id
left join public.waitlist_recovery_actions x on x.tenant_id=w.tenant_id and x.waitlist_entry_id=w.id and x.source_appointment_id=a.id
where w.status='waiting' and c.marketing_consent and c.linked_customer_id is null
 and (w.preferred_staff_id is null or w.preferred_staff_id=a.staff_id)
 and (a.starts_at at time zone 'Europe/Lisbon')::date between w.earliest_date and w.latest_date
 and a.starts_at>now()+interval '30 minutes'
 and not exists(
  select 1 from public.appointments occupied
  where occupied.tenant_id=a.tenant_id and occupied.staff_id=a.staff_id and occupied.status<>'cancelled'
   and tstzrange(occupied.starts_at,occupied.blocked_until,'[)') && tstzrange(a.starts_at,a.blocked_until,'[)')
 )
 and not exists(
  select 1 from public.appointments newer
  where newer.tenant_id=a.tenant_id and newer.staff_id=a.staff_id and newer.service_id=a.service_id
   and newer.starts_at=a.starts_at and newer.status='cancelled' and newer.updated_at>a.updated_at
 );
revoke all on public.revenue_recovery_opportunities from public,anon;
grant select on public.revenue_recovery_opportunities to authenticated;

create function private.record_waitlist_recovery_contact(p_tenant uuid,p_entry uuid,p_source uuid,p_message text,p_confirmed boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare opportunity record; consent_id uuid; action_id uuid;
begin
 if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_confirmed is distinct from true then raise exception 'Confirm that the customer was contacted'; end if;
 p_message:=btrim(p_message);
 if p_message is null or length(p_message) not between 1 and 600 then raise exception 'Enter the message sent to the customer'; end if;
 select * into opportunity from public.revenue_recovery_opportunities o
 where o.tenant_id=p_tenant and o.waitlist_entry_id=p_entry and o.source_appointment_id=p_source;
 if not found then raise exception 'This recovery opportunity is no longer available'; end if;
 if opportunity.recovery_action_id is not null then raise exception 'Contact was already recorded for this opportunity'; end if;
 select e.id into consent_id from public.customer_consent_events e
 join public.waitlist_entries w on w.tenant_id=e.tenant_id and w.customer_id=e.customer_id
 where w.tenant_id=p_tenant and w.id=p_entry and e.marketing_consent order by e.recorded_at desc limit 1;
 if consent_id is null then raise exception 'Current email consent evidence is unavailable'; end if;
 insert into public.waitlist_recovery_actions(tenant_id,waitlist_entry_id,source_appointment_id,consent_event_id,channel,message)
 values(p_tenant,p_entry,p_source,consent_id,'email',p_message) returning id into action_id;
 return action_id;
end $$;
create function public.record_waitlist_recovery_contact(p_tenant uuid,p_entry uuid,p_source uuid,p_message text,p_confirmed boolean) returns uuid
language sql set search_path='' as $$select private.record_waitlist_recovery_contact(p_tenant,p_entry,p_source,p_message,p_confirmed);$$;

create function private.book_waitlist_recovery(p_tenant uuid,p_action uuid,p_request uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare action public.waitlist_recovery_actions%rowtype; entry public.waitlist_entries%rowtype; source public.appointments%rowtype; customer public.customers%rowtype; service public.services%rowtype; appointment uuid;
begin
 if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into action from public.waitlist_recovery_actions where tenant_id=p_tenant and id=p_action for update;
 if not found then raise exception 'This recovery action is unavailable'; end if;
 if action.attributed_appointment_id is not null then return action.attributed_appointment_id; end if;
 select * into entry from public.waitlist_entries where tenant_id=p_tenant and id=action.waitlist_entry_id for update;
 select * into source from public.appointments where tenant_id=p_tenant and id=action.source_appointment_id;
 select * into customer from public.customers where tenant_id=p_tenant and id=entry.customer_id;
 select * into service from public.services where tenant_id=p_tenant and id=entry.service_id;
 if entry.status<>'waiting' or source.status<>'cancelled' or source.starts_at<=now()+interval '30 minutes' then raise exception 'This recovery opportunity is no longer available'; end if;
 if not customer.marketing_consent then raise exception 'The customer has withdrawn email consent'; end if;
 appointment:=private.rebook_customer(p_tenant,customer.id,customer.version,service.id,source.staff_id,source.starts_at,service.price_minor,service.duration_minutes,p_request);
 update public.waitlist_recovery_actions set attributed_appointment_id=appointment,attributed_at=now() where id=action.id;
 update public.waitlist_entries set status='booked',closed_at=now() where id=entry.id;
 return appointment;
end $$;
create function public.book_waitlist_recovery(p_tenant uuid,p_action uuid,p_request uuid) returns uuid
language sql set search_path='' as $$select private.book_waitlist_recovery(p_tenant,p_action,p_request);$$;

create function public.revenue_recovery_summary(p_tenant uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object(
  'open_slots',count(distinct o.source_appointment_id)::integer,
  'matching_customers',count(*)::integer,
  'contacts_recorded',(select count(*)::integer from public.waitlist_recovery_actions x where x.tenant_id=p_tenant),
  'bookings_attributed',(select count(x.attributed_appointment_id)::integer from public.waitlist_recovery_actions x where x.tenant_id=p_tenant),
  'booked_service_value_minor',(select coalesce(sum(a.price_minor),0)::bigint from public.waitlist_recovery_actions x join public.appointments a on a.tenant_id=x.tenant_id and a.id=x.attributed_appointment_id where x.tenant_id=p_tenant),
  'completed_recovered_value_minor',(select coalesce(sum(a.price_minor),0)::bigint from public.waitlist_recovery_actions x join public.appointments a on a.tenant_id=x.tenant_id and a.id=x.attributed_appointment_id and a.status='completed' where x.tenant_id=p_tenant)
 ) from public.revenue_recovery_opportunities o where o.tenant_id=p_tenant;
$$;

do $$ declare fn regprocedure; begin
 for fn in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('private','public') and p.proname in ('create_waitlist_entry','close_waitlist_entry','record_waitlist_recovery_contact','book_waitlist_recovery','revenue_recovery_summary')
 loop
  execute format('revoke all on function %s from public,anon,authenticated',fn);
  execute format('grant execute on function %s to authenticated',fn);
 end loop;
end $$;
