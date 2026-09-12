-- Customer profiles inherit appointment/customer RLS, including staff scope.
alter table public.customers add column version integer not null default 1;
alter table public.customers add column updated_at timestamptz not null default now();
create view public.customer_summaries with (security_invoker=true) as
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
 min(a.starts_at) filter(where a.status='confirmed' and a.starts_at>now()) as next_visit_at
 from public.customers c left join public.appointments a on a.tenant_id=c.tenant_id and a.customer_id=c.id
 group by c.id;
revoke all on public.customer_summaries from public,anon;
grant select on public.customer_summaries to authenticated;

create function private.update_customer(p_tenant uuid,p_id uuid,p_version integer,p_name text,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.customers%rowtype;
begin
 if not private.can_manage(p_tenant) or not exists(select 1 from public.tenants where id=p_tenant and active) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into c from public.customers where tenant_id=p_tenant and id=p_id for update;
 if not found or p_version is distinct from c.version then raise exception 'This profile changed. Reload and try again'; end if;
 p_name:=btrim(p_name);p_email:=lower(btrim(p_email));
 if p_name is null or length(p_name) not between 2 and 80 or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Check the name and email address'; end if;
 update public.customers set display_name=p_name,email=p_email,email_verified=case when email=p_email then email_verified else false end,version=version+1,updated_at=now() where id=c.id and tenant_id=p_tenant;
end $$;
create function public.update_customer(p_tenant uuid,p_id uuid,p_version integer,p_name text,p_email text) returns void
language sql set search_path='' as $$ select private.update_customer(p_tenant,p_id,p_version,p_name,p_email); $$;
revoke all on function private.update_customer(uuid,uuid,integer,text,text),public.update_customer(uuid,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function private.update_customer(uuid,uuid,integer,text,text),public.update_customer(uuid,uuid,integer,text,text) to authenticated;
