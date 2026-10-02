begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
select ok(not has_table_privilege('anon','public.revenue_protection_policies','SELECT'),'Guests cannot read business protection policies directly');
select ok(not has_table_privilege('anon','public.appointment_protections','SELECT'),'Guests cannot list appointment risk evidence');
select ok(not has_table_privilege('authenticated','public.appointment_deposit_payments','UPDATE'),'Payment evidence cannot be edited directly');
select ok(not has_table_privilege('authenticated','public.appointment_reminders','INSERT'),'Reminder evidence uses the authorized transaction');
select ok(not has_function_privilege('anon','private.attendance_risk(uuid,uuid,timestamptz)','EXECUTE'),'Guests cannot call the private risk classifier');
select ok(has_function_privilege('anon','public.booking_deposit_details(text,text)','EXECUTE'),'A booking capability can request its own deposit details');
select ok(not has_function_privilege('anon','public.finalize_stripe_deposit(text,text,boolean)','EXECUTE'),'Guests cannot finalize Stripe payments');
select ok(has_function_privilege('authenticated','public.save_revenue_protection_policy(uuid,boolean,text,integer,integer,integer)','EXECUTE'),'Authenticated managers can reach the policy authorization boundary');
select is(
  (select count(*) from public.revenue_protection_policies),
  (select count(*) from public.tenants),
  'Every existing tenant has a revenue protection policy'
);
insert into public.tenants(id,slug,name)
values ('33333333-3333-4333-8333-333333333333','policy-trigger-test','Policy Trigger Test');
select ok(
  exists(
    select 1 from public.revenue_protection_policies
    where tenant_id='33333333-3333-4333-8333-333333333333'
      and enabled=false and deposit_rule='none'
  ),
  'New tenants receive a default revenue protection policy'
);
select * from finish();
rollback;
