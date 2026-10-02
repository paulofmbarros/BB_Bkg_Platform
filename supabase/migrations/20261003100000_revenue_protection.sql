-- Revenue protection: explainable attendance risk, policy snapshots, deposits,
-- refunds, reminder evidence and conservative protected-value reporting.

create table public.revenue_protection_policies (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  enabled boolean not null default false,
  deposit_rule text not null default 'none'
    check (deposit_rule in ('none','risk_based','all')),
  deposit_percent integer not null default 30
    check (deposit_percent between 10 and 100),
  cancellation_window_hours integer not null default 24
    check (cancellation_window_hours between 0 and 168),
  reminder_lead_hours integer not null default 24
    check (reminder_lead_hours between 1 and 168),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.revenue_protection_policies(tenant_id)
select id from public.tenants on conflict do nothing;

create table public.appointment_protections (
  tenant_id uuid not null,
  appointment_id uuid not null,
  policy_version integer not null,
  risk_level text not null check (risk_level in ('standard','elevated','high')),
  completed_count integer not null check (completed_count >= 0),
  no_show_count integer not null check (no_show_count >= 0),
  cancelled_count integer not null check (cancelled_count >= 0),
  deposit_required_minor integer not null check (deposit_required_minor >= 0),
  deposit_percent integer not null check (deposit_percent between 0 and 100),
  cancellation_window_hours integer not null
    check (cancellation_window_hours between 0 and 168),
  reminder_lead_hours integer not null check (reminder_lead_hours between 1 and 168),
  cancellation_deadline timestamptz not null,
  reminder_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key(tenant_id,appointment_id),
  foreign key(tenant_id,appointment_id)
    references public.appointments(tenant_id,id) on delete cascade
);

create table public.appointment_deposit_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  appointment_id uuid not null,
  provider text not null check (provider in ('stripe','manual')),
  provider_reference text not null check (length(provider_reference) between 3 and 255),
  provider_payment_intent text check (provider_payment_intent is null or length(provider_payment_intent) between 3 and 255),
  refund_reference text check (refund_reference is null or length(refund_reference) between 3 and 255),
  status text not null check (status in ('pending','paid','failed','refunded')),
  amount_minor integer not null check (amount_minor > 0),
  refunded_minor integer not null default 0 check (refunded_minor >= 0 and refunded_minor <= amount_minor),
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider,provider_reference),
  foreign key(tenant_id,appointment_id)
    references public.appointments(tenant_id,id) on delete cascade,
  check ((status = 'paid' and paid_at is not null) or status <> 'paid'),
  check ((status = 'refunded' and paid_at is not null and refunded_at is not null and refunded_minor > 0) or status <> 'refunded')
);

create index appointment_deposit_payments_appointment_idx
  on public.appointment_deposit_payments(tenant_id,appointment_id,created_at desc);
create unique index appointment_one_pending_stripe_checkout
  on public.appointment_deposit_payments(tenant_id,appointment_id)
  where provider='stripe' and status='pending';

create table public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  appointment_id uuid not null,
  channel text not null default 'email' check (channel in ('email')),
  sent_at timestamptz not null default now(),
  recorded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(tenant_id,appointment_id,channel),
  foreign key(tenant_id,appointment_id)
    references public.appointments(tenant_id,id) on delete cascade
);

alter table public.appointments add column cancelled_at timestamptz;

alter table public.revenue_protection_policies enable row level security;
alter table public.appointment_protections enable row level security;
alter table public.appointment_deposit_payments enable row level security;
alter table public.appointment_reminders enable row level security;

revoke all on public.revenue_protection_policies,
  public.appointment_protections,
  public.appointment_deposit_payments,
  public.appointment_reminders from public,anon,authenticated;
grant select on public.revenue_protection_policies,
  public.appointment_protections,
  public.appointment_deposit_payments,
  public.appointment_reminders to authenticated;

create policy member_revenue_policy_read on public.revenue_protection_policies
  for select to authenticated
  using (private.tenant_role(tenant_id) is not null);
create policy manager_appointment_protection_read on public.appointment_protections
  for select to authenticated
  using (private.tenant_role(tenant_id) in ('owner','manager'));
create policy manager_deposit_payment_read on public.appointment_deposit_payments
  for select to authenticated
  using (private.tenant_role(tenant_id) in ('owner','manager'));
create policy manager_reminder_read on public.appointment_reminders
  for select to authenticated
  using (private.tenant_role(tenant_id) in ('owner','manager'));

create trigger audit_changes after insert or update or delete on public.revenue_protection_policies
  for each row execute function private.audit_change();
create trigger audit_changes after insert or update or delete on public.appointment_deposit_payments
  for each row execute function private.audit_change();
create trigger audit_changes after insert or update or delete on public.appointment_reminders
  for each row execute function private.audit_change();
create trigger immutable_tenant before update on public.revenue_protection_policies
  for each row execute function private.prevent_tenant_move();
create trigger immutable_tenant before update on public.appointment_protections
  for each row execute function private.prevent_tenant_move();
create trigger immutable_tenant before update on public.appointment_deposit_payments
  for each row execute function private.prevent_tenant_move();
create trigger immutable_tenant before update on public.appointment_reminders
  for each row execute function private.prevent_tenant_move();

create function private.attendance_risk(p_tenant uuid,p_customer uuid,p_before timestamptz)
returns table(risk_level text,completed_count integer,no_show_count integer,cancelled_count integer)
language sql stable set search_path='' as $$
  with history as (
    select
      count(*) filter(where status='completed')::integer completed_count,
      count(*) filter(where status='no_show')::integer no_show_count,
      count(*) filter(where status='cancelled')::integer cancelled_count
    from public.appointments
    where tenant_id=p_tenant and customer_id=p_customer and starts_at<p_before
  )
  select
    case
      when no_show_count>=2 or (no_show_count>=1 and completed_count=0) then 'high'
      when no_show_count=1 or (cancelled_count>=2 and completed_count<2) then 'elevated'
      else 'standard'
    end,
    completed_count,no_show_count,cancelled_count
  from history;
$$;
revoke all on function private.attendance_risk(uuid,uuid,timestamptz) from public,anon,authenticated;

create function private.snapshot_appointment_protection(p_tenant uuid,p_appointment uuid,p_retroactive boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare
  a public.appointments%rowtype;
  policy public.revenue_protection_policies%rowtype;
  risk record;
  required integer:=0;
begin
  select * into a from public.appointments where tenant_id=p_tenant and id=p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  select * into policy from public.revenue_protection_policies where tenant_id=p_tenant;
  if not found then
    insert into public.revenue_protection_policies(tenant_id) values(p_tenant)
      returning * into policy;
  end if;
  select * into risk from private.attendance_risk(p_tenant,a.customer_id,a.starts_at);
  if not p_retroactive and policy.enabled and a.price_minor>0 and
    (policy.deposit_rule='all' or (policy.deposit_rule='risk_based' and risk.risk_level in ('elevated','high'))) then
    required:=greatest(1,ceil(a.price_minor*policy.deposit_percent/100.0)::integer);
  end if;
  insert into public.appointment_protections(
    tenant_id,appointment_id,policy_version,risk_level,completed_count,no_show_count,cancelled_count,
    deposit_required_minor,deposit_percent,cancellation_window_hours,reminder_lead_hours,
    cancellation_deadline,reminder_due_at
  ) values(
    p_tenant,p_appointment,policy.version,risk.risk_level,risk.completed_count,risk.no_show_count,risk.cancelled_count,
    required,case when required>0 then policy.deposit_percent else 0 end,
    policy.cancellation_window_hours,policy.reminder_lead_hours,
    a.starts_at-make_interval(hours=>policy.cancellation_window_hours),
    a.starts_at-make_interval(hours=>policy.reminder_lead_hours)
  ) on conflict(tenant_id,appointment_id) do nothing;
end $$;
revoke all on function private.snapshot_appointment_protection(uuid,uuid,boolean) from public,anon,authenticated;

create function private.protect_new_appointment() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform private.snapshot_appointment_protection(new.tenant_id,new.id,false);
  return new;
end $$;
revoke all on function private.protect_new_appointment() from public,anon,authenticated;
create trigger snapshot_revenue_protection after insert on public.appointments
  for each row execute function private.protect_new_appointment();

-- Existing appointments retain their original no-deposit agreement.
do $$ declare a record; begin
  for a in select tenant_id,id from public.appointments loop
    perform private.snapshot_appointment_protection(a.tenant_id,a.id,true);
  end loop;
end $$;

create view public.revenue_protection_appointments
with (security_invoker=true) as
with payment as (
  select tenant_id,appointment_id,
    coalesce(sum(amount_minor) filter(where status in ('paid','refunded')),0)::bigint paid_minor,
    coalesce(sum(refunded_minor),0)::bigint refunded_minor
  from public.appointment_deposit_payments
  group by tenant_id,appointment_id
)
select
  p.tenant_id,p.appointment_id,a.customer_id,c.display_name customer_name,c.email customer_email,
  a.service_name,a.price_minor,a.starts_at,a.status appointment_status,a.cancelled_at,
  p.risk_level,p.completed_count,p.no_show_count,p.cancelled_count,
  p.deposit_required_minor,p.deposit_percent,p.cancellation_window_hours,p.reminder_lead_hours,
  p.cancellation_deadline,p.reminder_due_at,
  coalesce(pay.paid_minor,0)::bigint deposit_paid_minor,
  coalesce(pay.refunded_minor,0)::bigint deposit_refunded_minor,
  case
    when p.deposit_required_minor=0 then 'not_required'
    when coalesce(pay.refunded_minor,0)>0 and coalesce(pay.paid_minor,0)-coalesce(pay.refunded_minor,0)=0 then 'refunded'
    when coalesce(pay.paid_minor,0)-coalesce(pay.refunded_minor,0)<p.deposit_required_minor then 'pending'
    when a.status='no_show' or (a.status='cancelled' and a.cancelled_at>p.cancellation_deadline) then 'retained'
    when a.status='cancelled' then 'refund_due'
    else 'paid'
  end deposit_state,
  case
    when a.status<>'confirmed' then 'not_required'
    when exists(select 1 from public.appointment_reminders r where r.tenant_id=p.tenant_id and r.appointment_id=p.appointment_id) then 'sent'
    when p.reminder_due_at<=now() and a.starts_at>now() then 'due'
    when a.starts_at>now() then 'upcoming'
    else 'not_required'
  end reminder_state,
  case
    when (a.status='no_show' or (a.status='cancelled' and a.cancelled_at>p.cancellation_deadline))
    then greatest(0,coalesce(pay.paid_minor,0)-coalesce(pay.refunded_minor,0))::bigint
    else 0::bigint
  end protected_value_minor
from public.appointment_protections p
join public.appointments a on a.tenant_id=p.tenant_id and a.id=p.appointment_id
join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id
left join payment pay on pay.tenant_id=p.tenant_id and pay.appointment_id=p.appointment_id;
revoke all on public.revenue_protection_appointments from public,anon,authenticated;
grant select on public.revenue_protection_appointments to authenticated;

create function public.revenue_protection_summary(p_tenant uuid) returns jsonb
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
revoke all on function public.revenue_protection_summary(uuid) from public,anon,authenticated;
grant execute on function public.revenue_protection_summary(uuid) to authenticated;

create function private.save_revenue_protection_policy(
  p_tenant uuid,p_enabled boolean,p_deposit_rule text,p_deposit_percent integer,
  p_cancellation_window_hours integer,p_reminder_lead_hours integer
) returns void language plpgsql security definer set search_path='' as $$
begin
  if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_deposit_rule not in ('none','risk_based','all') or p_deposit_percent not between 10 and 100 or
    p_cancellation_window_hours not between 0 and 168 or p_reminder_lead_hours not between 1 and 168 then
    raise exception 'Check the protection policy';
  end if;
  insert into public.revenue_protection_policies(
    tenant_id,enabled,deposit_rule,deposit_percent,cancellation_window_hours,reminder_lead_hours
  ) values(p_tenant,p_enabled,p_deposit_rule,p_deposit_percent,p_cancellation_window_hours,p_reminder_lead_hours)
  on conflict(tenant_id) do update set
    enabled=excluded.enabled,deposit_rule=excluded.deposit_rule,deposit_percent=excluded.deposit_percent,
    cancellation_window_hours=excluded.cancellation_window_hours,reminder_lead_hours=excluded.reminder_lead_hours,
    version=public.revenue_protection_policies.version+1,updated_at=now();
end $$;
create function public.save_revenue_protection_policy(
  p_tenant uuid,p_enabled boolean,p_deposit_rule text,p_deposit_percent integer,
  p_cancellation_window_hours integer,p_reminder_lead_hours integer
) returns void language sql set search_path='' as $$
  select private.save_revenue_protection_policy(p_tenant,p_enabled,p_deposit_rule,p_deposit_percent,p_cancellation_window_hours,p_reminder_lead_hours);
$$;
revoke all on function private.save_revenue_protection_policy(uuid,boolean,text,integer,integer,integer),
  public.save_revenue_protection_policy(uuid,boolean,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.save_revenue_protection_policy(uuid,boolean,text,integer,integer,integer) to authenticated;

create function private.record_manual_deposit(p_tenant uuid,p_appointment uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare required integer; paid bigint; payment_id uuid;
begin
  if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
  select deposit_required_minor into required from public.appointment_protections
    where tenant_id=p_tenant and appointment_id=p_appointment for update;
  if not found or required=0 then raise exception 'No deposit is required for this appointment'; end if;
  select coalesce(sum(amount_minor-refunded_minor) filter(where status in ('paid','refunded')),0)
    into paid from public.appointment_deposit_payments where tenant_id=p_tenant and appointment_id=p_appointment;
  if paid>=required then raise exception 'The deposit is already paid'; end if;
  insert into public.appointment_deposit_payments(
    tenant_id,appointment_id,provider,provider_reference,status,amount_minor,paid_at
  ) values(p_tenant,p_appointment,'manual','manual:'||gen_random_uuid()::text,'paid',(required-paid)::integer,now())
  returning id into payment_id;
  return payment_id;
end $$;
create function public.record_manual_deposit(p_tenant uuid,p_appointment uuid) returns uuid
language sql set search_path='' as $$select private.record_manual_deposit(p_tenant,p_appointment);$$;
revoke all on function private.record_manual_deposit(uuid,uuid),public.record_manual_deposit(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_manual_deposit(uuid,uuid) to authenticated;

create function private.record_appointment_reminder(p_tenant uuid,p_appointment uuid,p_confirmed boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare reminder_id uuid;
begin
  if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_confirmed is distinct from true then raise exception 'Confirm that the reminder was sent'; end if;
  if not exists(select 1 from public.appointments where tenant_id=p_tenant and id=p_appointment and status='confirmed' and starts_at>now()) then
    raise exception 'This appointment no longer needs a reminder';
  end if;
  insert into public.appointment_reminders(tenant_id,appointment_id)
    values(p_tenant,p_appointment)
    on conflict(tenant_id,appointment_id,channel) do update set sent_at=excluded.sent_at,recorded_by=auth.uid()
    returning id into reminder_id;
  return reminder_id;
end $$;
create function public.record_appointment_reminder(p_tenant uuid,p_appointment uuid,p_confirmed boolean) returns uuid
language sql set search_path='' as $$select private.record_appointment_reminder(p_tenant,p_appointment,p_confirmed);$$;
revoke all on function private.record_appointment_reminder(uuid,uuid,boolean),public.record_appointment_reminder(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.record_appointment_reminder(uuid,uuid,boolean) to authenticated;

create function private.record_deposit_refund(p_tenant uuid,p_payment uuid,p_provider_reference text) returns void
language plpgsql security definer set search_path='' as $$
declare payment public.appointment_deposit_payments%rowtype;
begin
  if not private.can_manage(p_tenant) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into payment from public.appointment_deposit_payments
    where tenant_id=p_tenant and id=p_payment for update;
  if not found or payment.status<>'paid' then raise exception 'This deposit cannot be refunded'; end if;
  if payment.provider='stripe' and (p_provider_reference is null or length(p_provider_reference)<3) then
    raise exception 'Stripe refund confirmation is required';
  end if;
  update public.appointment_deposit_payments set
    status='refunded',refunded_minor=amount_minor,refunded_at=now(),updated_at=now(),
    refund_reference=case when provider='manual' then coalesce(p_provider_reference,'manual') else p_provider_reference end
  where id=payment.id;
end $$;
create function public.record_deposit_refund(p_tenant uuid,p_payment uuid,p_provider_reference text default null) returns void
language sql set search_path='' as $$select private.record_deposit_refund(p_tenant,p_payment,p_provider_reference);$$;
revoke all on function private.record_deposit_refund(uuid,uuid,text),public.record_deposit_refund(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_deposit_refund(uuid,uuid,text) to authenticated;

create function private.booking_deposit_details(p_host text,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tid uuid; aid uuid; result jsonb;
begin
  tid:=private.booking_tenant(p_host);
  if tid is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Booking not found'; end if;
  select appointment_id into aid from private.booking_capabilities
    where tenant_id=tid and token_hash=sha256(decode(p_token,'hex'));
  if aid is null then raise exception 'Booking not found'; end if;
  select jsonb_build_object(
    'tenant_id',a.tenant_id,'appointment_id',a.id,'customer_email',c.email,
    'business_name',t.name,'is_demo',t.is_demo,'service_name',a.service_name,'starts_at',a.starts_at,'appointment_status',a.status,
    'deposit_required_minor',p.deposit_required_minor,
    'deposit_paid_minor',coalesce((select sum(d.amount_minor-d.refunded_minor) from public.appointment_deposit_payments d where d.tenant_id=a.tenant_id and d.appointment_id=a.id and d.status in ('paid','refunded')),0),
    'pending_session',(select d.provider_reference from public.appointment_deposit_payments d where d.tenant_id=a.tenant_id and d.appointment_id=a.id and d.provider='stripe' and d.status='pending' order by d.created_at desc limit 1)
  ) into result
  from public.appointments a
  join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id
  join public.tenants t on t.id=a.tenant_id
  join public.appointment_protections p on p.tenant_id=a.tenant_id and p.appointment_id=a.id
  where a.tenant_id=tid and a.id=aid;
  return result;
end $$;
create function public.booking_deposit_details(p_host text,p_token text) returns jsonb
language sql set search_path='' as $$select private.booking_deposit_details(p_host,p_token);$$;
revoke all on function private.booking_deposit_details(text,text),public.booking_deposit_details(text,text) from public,anon,authenticated;
grant execute on function public.booking_deposit_details(text,text) to anon,authenticated;

create function private.register_stripe_deposit_checkout(p_host text,p_token text,p_session text) returns uuid
language plpgsql security definer set search_path='' as $$
declare details jsonb; payment_id uuid; required integer; paid integer; aid uuid; tid uuid;
begin
  if p_session is null or p_session !~ '^cs_[A-Za-z0-9_]+' or length(p_session)>255 then raise exception 'Invalid checkout session'; end if;
  details:=private.booking_deposit_details(p_host,p_token);
  if details is null then raise exception 'Booking not found'; end if;
  aid:=(details->>'appointment_id')::uuid; tid:=(details->>'tenant_id')::uuid;
  required:=(details->>'deposit_required_minor')::integer; paid:=(details->>'deposit_paid_minor')::integer;
  if details->>'appointment_status'<>'confirmed' or (details->>'starts_at')::timestamptz<=now() then raise exception 'This appointment cannot accept a deposit'; end if;
  if required<=paid then raise exception 'The deposit is already paid'; end if;
  insert into public.appointment_deposit_payments(
    tenant_id,appointment_id,provider,provider_reference,status,amount_minor
  ) values(tid,aid,'stripe',p_session,'pending',required-paid)
  on conflict(provider,provider_reference) do update set updated_at=now()
  returning id into payment_id;
  return payment_id;
end $$;
create function public.register_stripe_deposit_checkout(p_host text,p_token text,p_session text) returns uuid
language sql set search_path='' as $$select private.register_stripe_deposit_checkout(p_host,p_token,p_session);$$;
revoke all on function private.register_stripe_deposit_checkout(text,text,text),public.register_stripe_deposit_checkout(text,text,text) from public,anon,authenticated;
grant execute on function public.register_stripe_deposit_checkout(text,text,text) to anon,authenticated;

create function private.finalize_stripe_deposit(p_session text,p_payment_intent text,p_paid boolean) returns void
language plpgsql security definer set search_path='' as $$
declare payment public.appointment_deposit_payments%rowtype; required integer; already_paid bigint;
begin
  if auth.role()<>'service_role' then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into payment from public.appointment_deposit_payments
    where provider='stripe' and provider_reference=p_session for update;
  if not found or payment.status<>'pending' then return; end if;
  select deposit_required_minor into required from public.appointment_protections
    where tenant_id=payment.tenant_id and appointment_id=payment.appointment_id;
  select coalesce(sum(amount_minor-refunded_minor),0) into already_paid
    from public.appointment_deposit_payments
    where tenant_id=payment.tenant_id and appointment_id=payment.appointment_id
      and status in ('paid','refunded') and id<>payment.id;
  update public.appointment_deposit_payments set
    status=case when p_paid and already_paid<required then 'paid' else 'failed' end,
    provider_payment_intent=coalesce(p_payment_intent,provider_payment_intent),
    paid_at=case when p_paid and already_paid<required then coalesce(paid_at,now()) else paid_at end,
    updated_at=now()
  where id=payment.id;
end $$;
create function public.finalize_stripe_deposit(p_session text,p_payment_intent text,p_paid boolean) returns void
language sql set search_path='' as $$select private.finalize_stripe_deposit(p_session,p_payment_intent,p_paid);$$;
revoke all on function private.finalize_stripe_deposit(text,text,boolean),public.finalize_stripe_deposit(text,text,boolean) from public,anon,authenticated;
grant execute on function public.finalize_stripe_deposit(text,text,boolean) to service_role;

create function private.finalize_stripe_refund(p_payment_intent text,p_refund text,p_amount integer) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.role()<>'service_role' then raise exception 'Not authorized' using errcode='42501'; end if;
  update public.appointment_deposit_payments set
    status=case when p_amount>=amount_minor then 'refunded' else status end,
    refunded_minor=least(amount_minor,greatest(refunded_minor,p_amount)),
    refunded_at=case when p_amount>0 then coalesce(refunded_at,now()) else refunded_at end,
    refund_reference=coalesce(p_refund,refund_reference),updated_at=now()
  where provider='stripe' and provider_payment_intent=p_payment_intent and status in ('paid','refunded');
end $$;
create function public.finalize_stripe_refund(p_payment_intent text,p_refund text,p_amount integer) returns void
language sql set search_path='' as $$select private.finalize_stripe_refund(p_payment_intent,p_refund,p_amount);$$;
revoke all on function private.finalize_stripe_refund(text,text,integer),public.finalize_stripe_refund(text,text,integer) from public,anon,authenticated;
grant execute on function public.finalize_stripe_refund(text,text,integer) to service_role;

-- Preserve the existing transaction boundary while recording cancellation time
-- and moving the snapshotted deadlines when a visit is rescheduled.
create or replace function private.change_booking(p_tenant uuid,p_id uuid,p_version integer,p_action text,p_start timestamptz default null) returns void
language plpgsql set search_path='' as $$
declare a public.appointments%rowtype; slot record;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
  select * into a from public.appointments where tenant_id=p_tenant and id=p_id for update;
  if not found or p_version is distinct from a.version then raise exception 'This appointment changed. Reload and try again'; end if;
  if a.status<>'confirmed' then raise exception 'Only confirmed appointments can be changed'; end if;
  if p_action in ('cancel','reschedule') and a.starts_at<=now() then raise exception 'This appointment has already started'; end if;
  if p_action='cancel' then
    update public.appointments set status='cancelled',cancelled_at=now(),version=version+1,updated_at=now() where id=a.id;
  elsif p_action='reschedule' then
    select * into slot from private.available_slots(p_tenant,a.service_id,a.staff_id,(p_start at time zone 'Europe/Lisbon')::date,a.id) where starts_at=p_start;
    if not found then raise exception 'This time is no longer available. Please choose another'; end if;
    if slot.ends_at-slot.starts_at<>a.ends_at-a.starts_at or slot.blocked_until-slot.ends_at<>a.blocked_until-a.ends_at then raise exception 'Service duration changed. Please contact the shop'; end if;
    update public.appointments set starts_at=slot.starts_at,ends_at=slot.ends_at,blocked_until=slot.blocked_until,version=version+1,updated_at=now() where id=a.id;
    update public.appointment_protections set
      cancellation_deadline=slot.starts_at-make_interval(hours=>cancellation_window_hours),
      reminder_due_at=slot.starts_at-make_interval(hours=>reminder_lead_hours)
      where tenant_id=p_tenant and appointment_id=a.id;
  elsif p_action='complete' and a.ends_at<=now() then
    update public.appointments set status='completed',version=version+1,updated_at=now() where id=a.id;
  elsif p_action='no_show' and a.starts_at<=now() then
    update public.appointments set status='no_show',version=version+1,updated_at=now() where id=a.id;
  else raise exception 'This action is not available'; end if;
end $$;

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
    'barber',s.display_name,'customer_name',(select guest_name from private.booking_capabilities where appointment_id=aid and tenant_id=tid),'price_minor',a.price_minor,
    'starts_at',a.starts_at,'ends_at',a.ends_at,'status',a.status,'version',a.version,
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
  join public.customers c on c.tenant_id=a.tenant_id and c.id=a.customer_id
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

-- Public catalogue discloses policy terms, never customer risk or payment data.
create or replace function private.public_shop(p_hostname text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'booking_enabled',exists(select 1 from public.feature_entitlements e where e.tenant_id=t.id and e.feature='booking' and e.enabled),
    'public_locale',t.public_locale,'name',t.name,'slug',t.slug,'is_demo',t.is_demo,'currency',t.currency,
    'tagline',b.tagline,'description',b.description,'accent_color',b.accent_color,'logo_path',b.logo_path,
    'address',l.address,'phone',l.phone,'timezone',l.timezone,
    'protection_policy',coalesce((select jsonb_build_object(
      'enabled',p.enabled,'deposit_rule',p.deposit_rule,'deposit_percent',p.deposit_percent,
      'cancellation_window_hours',p.cancellation_window_hours,'reminder_lead_hours',p.reminder_lead_hours
    ) from public.revenue_protection_policies p where p.tenant_id=t.id),jsonb_build_object(
      'enabled',false,'deposit_rule','none','deposit_percent',30,'cancellation_window_hours',24,'reminder_lead_hours',24
    )),
    'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'duration_minutes',s.duration_minutes,'price_minor',s.price_minor,'category',s.category) order by s.price_minor) from public.services s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'display_name',s.display_name,'title',s.title,'bio',s.bio,'service_ids',coalesce((select jsonb_agg(ss.service_id) from public.staff_services ss where ss.tenant_id=s.tenant_id and ss.staff_id=s.id),'[]'::jsonb)) order by s.display_name) from public.staff_members s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',h.weekday,'enabled',h.enabled,'start_time',h.start_time,'end_time',h.end_time,'break_start',h.break_start,'break_end',h.break_end)) from public.business_hours h where h.tenant_id=t.id),'[]'::jsonb)
  ) from public.tenant_domains d join public.tenants t on t.id=d.tenant_id
  join public.tenant_branding b on b.tenant_id=t.id join public.locations l on l.tenant_id=t.id
  where d.hostname=p_hostname and d.verified_at is not null and t.active;
$$;

-- Enable the fictional Porto tenant with a conservative history-based policy.
update public.revenue_protection_policies set
  enabled=true,deposit_rule='risk_based',deposit_percent=30,
  cancellation_window_hours=24,reminder_lead_hours=24,updated_at=now()
where tenant_id='11111111-1111-4111-8111-111111111111';
