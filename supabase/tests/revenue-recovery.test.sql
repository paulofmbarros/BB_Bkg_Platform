begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(
  not has_table_privilege('anon','public.waitlist_entries','SELECT'),
  'Guests cannot read waitlist requests'
);
select ok(
  not has_table_privilege('anon','public.waitlist_recovery_actions','SELECT'),
  'Guests cannot read recovery contacts or attribution'
);
select ok(
  not has_table_privilege('anon','public.revenue_recovery_opportunities','SELECT'),
  'Guests cannot read cancellation matches'
);
select ok(
  not has_table_privilege('authenticated','public.waitlist_entries','INSERT'),
  'Waitlist creation uses the authorized transaction'
);
select ok(
  not has_table_privilege('authenticated','public.waitlist_recovery_actions','UPDATE'),
  'Recovery attribution cannot be edited directly'
);
select ok(
  not has_function_privilege('anon','public.create_waitlist_entry(uuid,uuid,uuid,uuid,date,date)','EXECUTE'),
  'Guests cannot create waitlist requests'
);
select ok(
  not has_function_privilege('anon','public.book_waitlist_recovery(uuid,uuid,uuid)','EXECUTE'),
  'Guests cannot book a released time'
);
select ok(
  has_function_privilege('authenticated','public.record_waitlist_recovery_contact(uuid,uuid,uuid,text,boolean)','EXECUTE'),
  'Authenticated managers can reach the contact authorization boundary'
);
select ok(
  has_function_privilege('authenticated','public.revenue_recovery_summary(uuid)','EXECUTE'),
  'Authenticated managers can reach the RLS-scoped recovery summary'
);

select * from finish();
rollback;
