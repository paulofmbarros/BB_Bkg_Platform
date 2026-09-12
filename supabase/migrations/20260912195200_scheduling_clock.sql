-- Internal clock injection makes DST regression tests independent of today.
-- It is never exposed to API callers.
drop function private.available_slots(uuid,uuid,uuid,date,uuid);
create function private.available_slots(p_tenant uuid,p_service uuid,p_staff uuid,p_day date,p_ignore uuid default null,p_now timestamptz default now())
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
 and p_day between (p_now at time zone l.timezone)::date and (p_now at time zone l.timezone)::date+90
 and g.instant >= p_now+interval '30 minutes'
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
revoke all on function private.available_slots(uuid,uuid,uuid,date,uuid,timestamptz) from public,anon,authenticated;
