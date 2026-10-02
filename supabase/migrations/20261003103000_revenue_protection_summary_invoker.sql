-- Read-only reporting must retain caller RLS instead of elevating in public.
create or replace function public.revenue_protection_summary(p_tenant uuid) returns jsonb
language plpgsql stable set search_path='' as $$
declare result jsonb;
begin
  if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
  select jsonb_build_object(
    'at_risk_upcoming',count(*) filter(where appointment_status='confirmed' and starts_at>now() and risk_level in ('elevated','high'))::integer,
    'deposits_required',count(*) filter(where deposit_required_minor>0 and appointment_status='confirmed' and starts_at>now())::integer,
    'deposit_secured_minor',coalesce(sum(greatest(0,deposit_paid_minor-deposit_refunded_minor)) filter(where appointment_status='confirmed' and starts_at>now()),0)::bigint,
    'refunds_due_minor',coalesce(sum(greatest(0,deposit_paid_minor-deposit_refunded_minor)) filter(where deposit_state='refund_due'),0)::bigint,
    'reminders_due',count(*) filter(where reminder_state='due')::integer,
    'protected_value_minor',coalesce(sum(protected_value_minor),0)::bigint
  ) into result
  from public.revenue_protection_appointments where tenant_id=p_tenant;
  return result;
end $$;
