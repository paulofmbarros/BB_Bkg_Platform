begin;
do $$
declare tid uuid:='11111111-1111-4111-8111-111111111111';i integer;attempt integer;cid uuid;aid uuid;day date;slot record;s public.services%rowtype;
begin
 if not exists(select 1 from public.tenants where id=tid and is_demo) then raise exception 'Synthetic tenant required';end if;
 perform pg_advisory_xact_lock(hashtextextended(tid::text,7202));
 select * into s from public.services where tenant_id=tid and id='10000000-0000-4000-8000-000000000001';
 for i in 1..2 loop
 cid:=('86000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;aid:=('87000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
 if exists(select 1 from public.appointments where id=aid)then continue;end if;
 day:=(now() at time zone 'Europe/Lisbon')::date-case when i=1 then 75 else 150 end;
 for attempt in 0..6 loop
 select * into slot from private.available_slots(tid,s.id,'30000000-0000-4000-8000-000000000001',day+attempt,null,(day-1)::timestamp at time zone 'Europe/Lisbon') limit 1;
 if found then exit;end if;
 end loop;
 if slot.starts_at is null then continue;end if;
 insert into public.customers(id,tenant_id,display_name,email,created_at)values(cid,tid,case when i=1 then 'Filipe Monteiro' else 'Eduardo Correia' end,'segment-demo-'||i||'@porto-gentlemen.example',slot.starts_at-interval '1 day')on conflict(id)do nothing;
 insert into public.appointments(id,tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until,status)
 select aid,tid,l.id,cid,s.id,'30000000-0000-4000-8000-000000000001',s.name,s.price_minor,slot.starts_at,slot.ends_at,slot.blocked_until,'completed' from public.locations l where l.tenant_id=tid;
 end loop;
end $$;
commit;
