-- Explicit V1 operating rules, not predictive scores. Inputs are computed under caller RLS.
create function private.classify_customer(p_visits integer,p_days integer,p_upcoming integer,p_pending integer,p_duplicates bigint) returns text language sql immutable set search_path='' as $$
 select case
 when p_pending>0 or p_duplicates>0 or p_days<0 then 'needs_review'
 when p_visits=0 then 'new'
 when p_upcoming=0 and p_days>=120 then 'inactive'
 when p_upcoming=0 and p_days>=60 then 'at_risk'
 when p_visits>=3 then 'regular'
 when p_visits=2 then 'returning'
 else 'new' end;
$$;
revoke all on function private.classify_customer(integer,integer,integer,integer,bigint) from public,anon;
grant execute on function private.classify_customer(integer,integer,integer,integer,bigint) to authenticated;
create view public.customer_segments with(security_invoker=true) as
 select s.*,d.days_since_visit,d.duplicate_records,
 private.classify_customer(s.completed_visits,d.days_since_visit,s.upcoming_visits,s.awaiting_outcome,d.duplicate_records) as segment
 from public.customer_summaries s
 cross join lateral(select (now() at time zone 'Europe/Lisbon')::date-(s.last_visit_at at time zone 'Europe/Lisbon')::date as days_since_visit,
 (select count(*) from public.customers c where c.tenant_id=s.tenant_id and c.id<>s.id and c.linked_customer_id is null and lower(c.email)=lower(s.email)) as duplicate_records) d
 where private.tenant_role(s.tenant_id) in ('owner','manager');
revoke all on public.customer_segments from public,anon;
grant select on public.customer_segments to authenticated;
create function public.customer_segment_counts(p_tenant uuid,p_query text default '') returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('segment',segment,'count',n)),'[]'::jsonb) from (
 select segment,count(*) as n from public.customer_segments where tenant_id=p_tenant and position(lower(left(coalesce(p_query,''),100)) in search_text)>0 group by segment
 ) counts;
$$;
revoke all on function public.customer_segment_counts(uuid,text) from public,anon;
grant execute on function public.customer_segment_counts(uuid,text) to authenticated;
