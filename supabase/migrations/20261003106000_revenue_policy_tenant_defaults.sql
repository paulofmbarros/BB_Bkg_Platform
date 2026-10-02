-- Every tenant needs a policy row, including tenants created after the revenue
-- protection migration and tenants inserted later by seed or provisioning flows.
create function private.ensure_revenue_protection_policy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.revenue_protection_policies(tenant_id)
  values (new.id)
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

revoke all on function private.ensure_revenue_protection_policy()
  from public, anon, authenticated;

create trigger ensure_revenue_protection_policy
after insert on public.tenants
for each row execute function private.ensure_revenue_protection_policy();

insert into public.revenue_protection_policies(tenant_id)
select id from public.tenants
on conflict (tenant_id) do nothing;
