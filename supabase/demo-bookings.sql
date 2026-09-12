-- Small, explicitly synthetic calendar fixture. Safe to rerun; never rewrites bookings.
begin;
do $$
declare tid uuid:='11111111-1111-4111-8111-111111111111'; d record; s public.services%rowtype; staff uuid; cid uuid; aid uuid; start_at timestamptz; finish_at timestamptz; blocked timestamptz; n integer:=0; i integer; names text[]:=array['Miguel Santos','Tiago Alves','Pedro Costa','João Martins','Rui Sousa','Diogo Silva','Nuno Pereira','Bruno Ribeiro','André Lopes','Tomás Carvalho','Gonçalo Neves','Vasco Reis'];
begin
 if not exists(select 1 from public.tenants where id=tid and is_demo) then raise exception 'Synthetic tenant required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tid::text,7202));
 select * into s from public.services where tenant_id=tid and id='10000000-0000-4000-8000-000000000001';
 for d in select ((now() at time zone 'Europe/Lisbon')::date+g.n) as day from generate_series(0,10) g(n) join public.business_hours h on h.tenant_id=tid and h.weekday=extract(dow from (now() at time zone 'Europe/Lisbon')::date+g.n) and h.enabled order by g.n limit 3 loop
  for i in 1..4 loop
   n:=n+1;cid:=('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;aid:=('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
   if exists(select 1 from public.appointments where id=aid) then continue; end if;
   staff:=('30000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
   start_at:=(d.day+(array['09:00'::time,'11:00'::time,'14:00'::time,'16:00'::time])[i]) at time zone 'Europe/Lisbon';
   select ends_at,blocked_until into finish_at,blocked from private.available_slots(tid,s.id,staff,d.day,null,d.day::timestamp at time zone 'Europe/Lisbon'-interval '1 day') where starts_at=start_at;
   if not found then continue; end if;
   insert into public.customers(id,tenant_id,display_name,email) values(cid,tid,names[n],'calendar-demo-'||n||'@porto-gentlemen.example') on conflict(id) do nothing;
   insert into public.appointments(id,tenant_id,location_id,customer_id,service_id,staff_id,service_name,price_minor,starts_at,ends_at,blocked_until,status)
   select aid,tid,l.id,cid,s.id,staff,s.name,s.price_minor,start_at,finish_at,blocked,case when finish_at<now() then case when i=3 then 'no_show' when i=4 then 'confirmed' else 'completed' end else 'confirmed' end from public.locations l where l.tenant_id=tid;
  end loop;
 end loop;
end $$;
commit;
