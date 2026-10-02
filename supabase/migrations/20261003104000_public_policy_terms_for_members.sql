-- Deposit and cancellation terms are already public on the shop catalogue.
-- Same-tenant staff may read those terms, but not customer risk or payment data.
drop policy if exists manager_revenue_policy_read on public.revenue_protection_policies;
drop policy if exists member_revenue_policy_read on public.revenue_protection_policies;
create policy member_revenue_policy_read on public.revenue_protection_policies
  for select to authenticated
  using (private.tenant_role(tenant_id) is not null);
