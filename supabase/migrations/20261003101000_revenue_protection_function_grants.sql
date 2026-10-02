-- Public SQL wrappers execute with caller privileges, so their narrowly scoped
-- private implementations need the same role grants as the established booking
-- and retention transaction boundaries.
grant execute on function private.save_revenue_protection_policy(uuid,boolean,text,integer,integer,integer) to authenticated;
grant execute on function private.record_manual_deposit(uuid,uuid) to authenticated;
grant execute on function private.record_appointment_reminder(uuid,uuid,boolean) to authenticated;
grant execute on function private.record_deposit_refund(uuid,uuid,text) to authenticated;
grant execute on function private.booking_deposit_details(text,text) to anon,authenticated;
grant execute on function private.register_stripe_deposit_checkout(text,text,text) to anon,authenticated;
grant execute on function private.finalize_stripe_deposit(text,text,boolean) to service_role;
grant execute on function private.finalize_stripe_refund(text,text,integer) to service_role;
