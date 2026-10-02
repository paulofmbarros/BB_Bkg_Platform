-- Customer linking intentionally preserves the name captured when the guest
-- booked. Extend that receipt with deposit data without exposing the retained
-- profile's identity.
create or replace function private.manage_booking(p_host text,p_token text,p_action text default 'view',p_version integer default null,p_start timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tid uuid; aid uuid; result jsonb;
begin
  tid:=private.booking_tenant(p_host);
  if tid is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Booking not found'; end if;
  select appointment_id into aid from private.booking_capabilities where tenant_id=tid and token_hash=sha256(decode(p_token,'hex'));
  if aid is null then raise exception 'Booking not found'; end if;
  if p_action not in ('view','cancel','reschedule') or p_action is null then raise exception 'Invalid action'; end if;
  if p_action<>'view' then perform private.change_booking(tid,aid,p_version,p_action,p_start); end if;
  select jsonb_build_object(
    'id',a.id,'service_id',a.service_id,'staff_id',a.staff_id,'service_name',a.service_name,
    'barber',s.display_name,'customer_name',(select guest_name from private.booking_capabilities where appointment_id=aid and tenant_id=tid),
    'price_minor',a.price_minor,'starts_at',a.starts_at,'ends_at',a.ends_at,'status',a.status,'version',a.version,
    'deposit_required_minor',p.deposit_required_minor,
    'deposit_paid_minor',coalesce(pay.paid_minor,0),
    'deposit_refunded_minor',coalesce(pay.refunded_minor,0),
    'deposit_status',case
      when p.deposit_required_minor=0 then 'not_required'
      when coalesce(pay.refunded_minor,0)>0 and coalesce(pay.paid_minor,0)-coalesce(pay.refunded_minor,0)=0 then 'refunded'
      when coalesce(pay.paid_minor,0)-coalesce(pay.refunded_minor,0)<p.deposit_required_minor then 'pending'
      when a.status='no_show' or (a.status='cancelled' and a.cancelled_at>p.cancellation_deadline) then 'retained'
      when a.status='cancelled' then 'refund_due'
      else 'paid' end,
    'cancellation_deadline',p.cancellation_deadline
  ) into result
  from public.appointments a
  join public.staff_members s on s.tenant_id=a.tenant_id and s.id=a.staff_id
  join public.appointment_protections p on p.tenant_id=a.tenant_id and p.appointment_id=a.id
  left join lateral (
    select
      coalesce(sum(d.amount_minor) filter(where d.status in ('paid','refunded')),0)::bigint paid_minor,
      coalesce(sum(d.refunded_minor),0)::bigint refunded_minor
    from public.appointment_deposit_payments d where d.tenant_id=a.tenant_id and d.appointment_id=a.id
  ) pay on true
  where a.id=aid and a.tenant_id=tid;
  return result;
end $$;
