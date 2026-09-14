-- Explainable rebooking opportunities derived from completed visit cadence.
create function private.rebooking_lead_days(p_interval_days integer) returns integer
language sql immutable set search_path='' as $$
 select case when p_interval_days<1 then null else least(7,greatest(2,round(p_interval_days*0.2)::integer)) end;
$$;
revoke all on function private.rebooking_lead_days(integer) from public,anon;
grant execute on function private.rebooking_lead_days(integer) to authenticated;

create view public.customer_rebooking_opportunities with(security_invoker=true) as
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
), latest_visit as (
 select distinct on(a.tenant_id,a.customer_id)
 a.tenant_id,a.customer_id,a.service_id,a.staff_id,a.service_name,a.price_minor
 from public.appointments a
 where a.status='completed'
 order by a.tenant_id,a.customer_id,a.starts_at desc,a.id desc
)
select s.id,s.tenant_id,s.display_name,s.email,s.marketing_consent,s.last_visit_at,
 c.completed_visit_days,c.typical_interval_days,s.days_since_visit,
 (c.typical_interval_days-s.days_since_visit)::integer as due_in_days,
 l.service_id,l.staff_id,l.service_name,l.price_minor as potential_value_minor,
 st.display_name as staff_name
from public.customer_segments s
join cadence c on c.tenant_id=s.tenant_id and c.customer_id=s.id
join latest_visit l on l.tenant_id=s.tenant_id and l.customer_id=s.id
left join public.staff_members st on st.tenant_id=l.tenant_id and st.id=l.staff_id
where c.completed_visit_days>=3
 and c.typical_interval_days>0
 and s.days_since_visit>=0
 and s.upcoming_visits=0
 and s.awaiting_outcome=0
 and s.duplicate_records=0
 and c.typical_interval_days-s.days_since_visit<=private.rebooking_lead_days(c.typical_interval_days);
revoke all on public.customer_rebooking_opportunities from public,anon;
grant select on public.customer_rebooking_opportunities to authenticated;

create function public.customer_rebooking_opportunity_summary(p_tenant uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object(
  'count',count(*)::integer,
  'potential_value_minor',coalesce(sum(potential_value_minor),0)::bigint
 )
 from public.customer_rebooking_opportunities
 where tenant_id=p_tenant;
$$;
revoke all on function public.customer_rebooking_opportunity_summary(uuid) from public,anon;
grant execute on function public.customer_rebooking_opportunity_summary(uuid) to authenticated;
