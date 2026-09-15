-- Reproducible, small synthetic histories for the Phase 3 customer walkthrough.
begin;
do $$
declare tid uuid:='11111111-1111-4111-8111-111111111111'; s public.services%rowtype; target_day date; start_at timestamptz; finish_at timestamptz; blocked timestamptz; staff uuid; cid uuid; aid uuid; j integer; attempt integer; ordinal integer; fixture_ordinal integer; names text[]:=array['Ricardo Ferreira','Hugo Carvalho','Daniel Rocha','Marco Teixeira','Fábio Martins','Sérgio Pinto','Luís Cardoso','Mário Oliveira'];
begin
 if not exists(select 1 from public.tenants where id=tid and is_demo) then raise exception 'Synthetic tenant required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tid::text,7202));
 select * into s from public.services where tenant_id=tid and id='10000000-0000-4000-8000-000000000001';
 -- Calendar customer 1 keeps a visible history for the profile walkthrough.
 -- Dedicated opportunity customers have no future bookings, so calendar fixtures
 -- cannot disqualify every rebooking example.
 for ordinal in 0..8 loop
  fixture_ordinal:=greatest(ordinal,1);
  if ordinal=0 then
   cid:='60000000-0000-4000-8000-000000000001';
   insert into public.customers(id,tenant_id,display_name,email)
   values(cid,tid,'Miguel Santos','calendar-demo-1@porto-gentlemen.example')
   on conflict(id) do nothing;
  else
   cid:=('88000000-0000-4000-8000-'||lpad(ordinal::text,12,'0'))::uuid;
   insert into public.customers(id,tenant_id,display_name,email)
   values(cid,tid,names[ordinal],'opportunity-demo-'||ordinal||'@porto-gentlemen.example')
   on conflict(id) do nothing;
  end if;
  staff:=('30000000-0000-4000-8000-'||lpad(((fixture_ordinal-1)%4+1)::text,12,'0'))::uuid;
  for j in 1..4 loop
   aid:=((case when ordinal=0 then '71000000-0000-4000-8000-' else '89000000-0000-4000-8000-' end)||lpad((fixture_ordinal*10+j)::text,12,'0'))::uuid;
   if exists(select 1 from public.appointments where id=aid) then continue; end if;
   -- Stagger customers across past weeks; search forward within that historical week.
   target_day:=(now() at time zone 'Europe/Lisbon')::date-(j*28+fixture_ordinal);
   for attempt in 0..6 loop
    select starts_at,ends_at,blocked_until into start_at,finish_at,blocked from private.available_slots(tid,s.id,staff,target_day+attempt,null,(target_day-1)::timestamp at time zone 'Europe/Lisbon') limit 1;
    if found then exit; end if;
   end loop;
   if start_at is null then continue; end if;
   insert into public.appointments(id,tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until,status)
   select aid,tid,l.id,cid,s.id,staff,s.name,s.price_minor,start_at,finish_at,blocked,
   case when fixture_ordinal%3=0 and j=1 then 'cancelled' when fixture_ordinal%4=0 and j=2 then 'no_show' else 'completed' end
   from public.locations l where l.tenant_id=tid;
   -- Historical fixture profiles predate their first visit. Never change normal customer records.
   update public.customers set created_at=least(created_at,start_at-interval '1 day') where id=cid and tenant_id=tid;
  end loop;
 end loop;
end $$;
commit;
