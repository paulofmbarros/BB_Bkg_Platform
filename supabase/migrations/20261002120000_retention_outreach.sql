-- Deterministic retention health, explicit marketing consent and attributable
-- rebooking outreach. Recording an outreach confirms that the owner contacted
-- the customer externally; this migration does not send email.

create view public.customer_retention_health with(security_invoker=true) as
with completed_days as (
 select a.tenant_id,a.customer_id,(a.starts_at at time zone 'Europe/Lisbon')::date as visit_day
 from public.appointments a
 where a.status='completed'
 group by a.tenant_id,a.customer_id,(a.starts_at at time zone 'Europe/Lisbon')::date
), visit_gaps as (
 select tenant_id,customer_id,visit_day-lag(visit_day) over(partition by tenant_id,customer_id order by visit_day) as interval_days
 from completed_days
), cadence as (
 select tenant_id,customer_id,(count(interval_days)+1)::integer as completed_visit_days,
 percentile_disc(0.5) within group(order by interval_days)::integer as typical_interval_days
 from visit_gaps
 where interval_days>0
 group by tenant_id,customer_id
)
select s.id,s.tenant_id,s.segment,s.days_since_visit,s.duplicate_records,
 coalesce(c.completed_visit_days,s.completed_visits)::integer as completed_visit_days,
 c.typical_interval_days,
 case when c.typical_interval_days is null or s.days_since_visit is null then null
 else (c.typical_interval_days-s.days_since_visit)::integer end as due_in_days,
 case
  when s.segment='needs_review' then 'needs_review'
  when s.upcoming_visits>0 then 'booked'
  when c.typical_interval_days is not null and c.typical_interval_days-s.days_since_visit<0 then 'overdue'
  when c.typical_interval_days is not null and c.typical_interval_days-s.days_since_visit<=private.rebooking_lead_days(c.typical_interval_days) then 'due_soon'
  when c.typical_interval_days is not null then 'on_track'
  when s.segment='inactive' then 'inactive'
  when s.segment='at_risk' then 'at_risk'
  else 'building_history'
 end as health_status
from public.customer_segments s
left join cadence c on c.tenant_id=s.tenant_id and c.customer_id=s.id;
revoke all on public.customer_retention_health from public,anon;
grant select on public.customer_retention_health to authenticated;

create table public.customer_consent_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 customer_id uuid not null,
 marketing_consent boolean not null,
 confirmation text not null check(confirmation='customer_confirmed'),
 recorded_by uuid not null default auth.uid() references auth.users(id),
 recorded_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,customer_id) references public.customers(tenant_id,id)
);
create index customer_consent_customer_time_idx on public.customer_consent_events(tenant_id,customer_id,recorded_at desc);
alter table public.customer_consent_events enable row level security;
revoke all on public.customer_consent_events from public,anon,authenticated;
grant select on public.customer_consent_events to authenticated;
create policy manager_consent_read on public.customer_consent_events for select to authenticated
 using(private.tenant_role(tenant_id) in ('owner','manager'));
create trigger audit_changes after insert or update or delete on public.customer_consent_events
 for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.customer_consent_events
 for each row execute function private.prevent_tenant_move();

create function private.set_customer_marketing_consent(p_tenant uuid,p_customer uuid,p_version integer,p_consent boolean,p_confirmed boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.customers%rowtype; event_id uuid;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_confirmed is distinct from true then raise exception 'Confirm the customer requested this consent change'; end if;
 select * into c from public.customers where tenant_id=p_tenant and id=p_customer for update;
 if not found or c.linked_customer_id is not null then raise exception 'Open the retained customer profile before changing consent'; end if;
 if c.version is distinct from p_version then raise exception 'Customer details changed. Reload before changing consent'; end if;
 if c.marketing_consent is not distinct from p_consent then raise exception 'Marketing consent already has this status'; end if;
 update public.customers set marketing_consent=p_consent,version=version+1,updated_at=now() where tenant_id=p_tenant and id=p_customer;
 insert into public.customer_consent_events(tenant_id,customer_id,marketing_consent,confirmation)
 values(p_tenant,p_customer,p_consent,'customer_confirmed') returning id into event_id;
 return event_id;
end $$;
create function public.set_customer_marketing_consent(p_tenant uuid,p_customer uuid,p_version integer,p_consent boolean,p_confirmed boolean) returns uuid
language sql set search_path='' as $$select private.set_customer_marketing_consent(p_tenant,p_customer,p_version,p_consent,p_confirmed);$$;
revoke all on function private.set_customer_marketing_consent(uuid,uuid,integer,boolean,boolean),public.set_customer_marketing_consent(uuid,uuid,integer,boolean,boolean) from public,anon,authenticated;
grant execute on function private.set_customer_marketing_consent(uuid,uuid,integer,boolean,boolean),public.set_customer_marketing_consent(uuid,uuid,integer,boolean,boolean) to authenticated;

create table public.customer_outreach_actions (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 customer_id uuid not null,
 consent_event_id uuid not null,
 channel text not null check(channel='email'),
 purpose text not null check(purpose='rebooking'),
 message text not null check(length(message) between 1 and 600),
 recorded_by uuid not null default auth.uid() references auth.users(id),
 contacted_at timestamptz not null default now(),
 attributed_appointment_id uuid,
 attributed_at timestamptz,
 unique(tenant_id,id),
 unique(attributed_appointment_id),
 foreign key(tenant_id,customer_id) references public.customers(tenant_id,id),
 foreign key(tenant_id,consent_event_id) references public.customer_consent_events(tenant_id,id),
 foreign key(tenant_id,attributed_appointment_id) references public.appointments(tenant_id,id),
 check((attributed_appointment_id is null and attributed_at is null) or (attributed_appointment_id is not null and attributed_at is not null))
);
create index customer_outreach_customer_time_idx on public.customer_outreach_actions(tenant_id,customer_id,contacted_at desc);
alter table public.customer_outreach_actions enable row level security;
revoke all on public.customer_outreach_actions from public,anon,authenticated;
grant select on public.customer_outreach_actions to authenticated;
create policy manager_outreach_read on public.customer_outreach_actions for select to authenticated
 using(private.tenant_role(tenant_id) in ('owner','manager'));
create trigger audit_changes after insert or update or delete on public.customer_outreach_actions
 for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.customer_outreach_actions
 for each row execute function private.prevent_tenant_move();

create function private.record_customer_outreach(p_tenant uuid,p_customer uuid,p_message text,p_confirmed boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.customers%rowtype; consent_id uuid; outreach_id uuid;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_confirmed is distinct from true then raise exception 'Confirm that the message was sent'; end if;
 p_message:=btrim(p_message);
 if p_message is null or length(p_message) not between 1 and 600 then raise exception 'Enter the message that was sent'; end if;
 select * into c from public.customers where tenant_id=p_tenant and id=p_customer for update;
 if not found or c.linked_customer_id is not null then raise exception 'Open the retained customer profile before recording outreach'; end if;
 if not c.marketing_consent then raise exception 'This customer has not opted in to marketing'; end if;
 select id into consent_id from public.customer_consent_events
 where tenant_id=p_tenant and customer_id=p_customer and marketing_consent
 order by recorded_at desc,id desc limit 1;
 if consent_id is null then raise exception 'Record the customer consent before outreach'; end if;
 if not exists(select 1 from public.customer_rebooking_opportunities where tenant_id=p_tenant and id=p_customer) then raise exception 'This customer is no longer a rebooking opportunity'; end if;
 if exists(select 1 from public.customer_outreach_actions where tenant_id=p_tenant and customer_id=p_customer and purpose='rebooking' and attributed_appointment_id is null and contacted_at>now()-interval '7 days') then raise exception 'Rebooking outreach was already recorded in the last 7 days'; end if;
 insert into public.customer_outreach_actions(tenant_id,customer_id,consent_event_id,channel,purpose,message)
 values(p_tenant,p_customer,consent_id,'email','rebooking',p_message) returning id into outreach_id;
 return outreach_id;
end $$;
create function public.record_customer_outreach(p_tenant uuid,p_customer uuid,p_message text,p_confirmed boolean) returns uuid
language sql set search_path='' as $$select private.record_customer_outreach(p_tenant,p_customer,p_message,p_confirmed);$$;
revoke all on function private.record_customer_outreach(uuid,uuid,text,boolean),public.record_customer_outreach(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function private.record_customer_outreach(uuid,uuid,text,boolean),public.record_customer_outreach(uuid,uuid,text,boolean) to authenticated;

create function private.rebook_customer_from_outreach(p_tenant uuid,p_customer uuid,p_customer_version integer,p_service uuid,p_staff uuid,p_start timestamptz,p_price integer,p_duration integer,p_request uuid,p_outreach uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare outreach public.customer_outreach_actions%rowtype; appointment uuid;
begin
 select * into outreach from public.customer_outreach_actions where tenant_id=p_tenant and id=p_outreach and customer_id=p_customer for update;
 if not found then raise exception 'This outreach record is unavailable'; end if;
 if outreach.contacted_at<now()-interval '30 days' then raise exception 'This outreach record is too old for direct attribution'; end if;
 appointment:=private.rebook_customer(p_tenant,p_customer,p_customer_version,p_service,p_staff,p_start,p_price,p_duration,p_request);
 if outreach.attributed_appointment_id is null then
  update public.customer_outreach_actions set attributed_appointment_id=appointment,attributed_at=now() where id=outreach.id;
 elsif outreach.attributed_appointment_id<>appointment then
  raise exception 'This outreach has already been attributed to another appointment';
 end if;
 return appointment;
end $$;
create function public.rebook_customer_from_outreach(p_tenant uuid,p_customer uuid,p_customer_version integer,p_service uuid,p_staff uuid,p_start timestamptz,p_price integer,p_duration integer,p_request uuid,p_outreach uuid) returns uuid
language sql set search_path='' as $$select private.rebook_customer_from_outreach(p_tenant,p_customer,p_customer_version,p_service,p_staff,p_start,p_price,p_duration,p_request,p_outreach);$$;
revoke all on function private.rebook_customer_from_outreach(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid,uuid),public.rebook_customer_from_outreach(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid,uuid) from public,anon,authenticated;
grant execute on function private.rebook_customer_from_outreach(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid,uuid),public.rebook_customer_from_outreach(uuid,uuid,integer,uuid,uuid,timestamptz,integer,integer,uuid,uuid) to authenticated;

create function public.customer_outreach_summary(p_tenant uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object(
  'outreach_count',count(*)::integer,
  'attributed_bookings',count(attributed_appointment_id)::integer,
  'attributed_service_value_minor',coalesce(sum(a.price_minor) filter(where o.attributed_appointment_id is not null),0)::bigint
 )
 from public.customer_outreach_actions o
 left join public.appointments a on a.tenant_id=o.tenant_id and a.id=o.attributed_appointment_id
 where o.tenant_id=p_tenant;
$$;
revoke all on function public.customer_outreach_summary(uuid) from public,anon;
grant execute on function public.customer_outreach_summary(uuid) to authenticated;
