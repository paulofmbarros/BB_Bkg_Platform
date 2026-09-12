insert into public.tenants(id,slug,name,is_demo) values
('11111111-1111-4111-8111-111111111111','porto-gentlemen','Porto Gentlemen',true),
('22222222-2222-4222-8222-222222222222','atelier-lisboa','Atelier Lisboa',true);
insert into public.tenant_branding(tenant_id,tagline,description,accent_color) values
('11111111-1111-4111-8111-111111111111','Good hair. Good company.','A considered cut. An unhurried conversation. Your neighbourhood barbershop in the heart of Porto.','#254B3F'),
('22222222-2222-4222-8222-222222222222','Made for your everyday.','Modern grooming in the heart of Lisboa.','#634B40');
insert into public.tenant_domains(hostname,tenant_id,verified_at,is_primary) values
('porto-gentlemen.localhost','11111111-1111-4111-8111-111111111111',now(),true),
('atelier-lisboa.localhost','22222222-2222-4222-8222-222222222222',now(),true);
insert into public.locations(id,tenant_id,address,phone) values
('11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Rua de Cedofeita, Porto','+351 220 000 000'),
('22222222-2222-4222-8222-222222222223','22222222-2222-4222-8222-222222222222','Príncipe Real, Lisboa','+351 210 000 000');
insert into public.services(id,tenant_id,name,description,category,duration_minutes,buffer_minutes,price_minor) values
('10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Signature cut','A tailored cut, wash and finish. The everyday, elevated.','Hair',45,5,2800),
('10000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Skin fade','A precise fade with a clean, considered finish.','Hair',45,5,3000),
('10000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Beard sculpt','Shape, definition and a warm towel to finish.','Beard',30,5,1800),
('10000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Cut & beard','The signature cut paired with a full beard service.','Rituals',60,10,4200),
('10000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Traditional shave','Hot towels, a straight razor and a moment to slow down.','Beard',30,5,2200),
('10000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','The gentlemen’s ritual','Our complete cut, beard and grooming experience.','Rituals',90,10,5800),
('20000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','Atelier cut','A contemporary cut and finish.','Hair',45,5,3200);
insert into public.staff_members(id,tenant_id,display_name,title,bio) values
('30000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Miguel Santos','Founder · Master barber','Classic cuts, thoughtful details and good conversation.'),
('30000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Rafael Costa','Senior barber','Precision fades and a fresh perspective.'),
('30000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','André Ferreira','Barber','Modern shapes with an old-school attention to detail.'),
('30000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Tomás Oliveira','Barber','Easy-going service. A finish that feels like you.'),
('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','Duarte Silva','Founder','Contemporary grooming in Lisboa.');
insert into public.business_hours(tenant_id,location_id,weekday,enabled,start_time,end_time,break_start,break_end)
select tenant_id,id,d,d not in (0,1),'09:00'::time,'19:00'::time,'13:00'::time,'14:00'::time from public.locations cross join generate_series(0,6) d;
insert into public.staff_working_hours select s.tenant_id,s.id,h.weekday,h.enabled,h.start_time,h.end_time,h.break_start,h.break_end from public.staff_members s join public.business_hours h on s.tenant_id=h.tenant_id;
insert into public.staff_services select s.tenant_id,s.id,v.id from public.staff_members s join public.services v on s.tenant_id=v.tenant_id;
insert into public.feature_entitlements select id,'foundation',true from public.tenants;

-- Phase 2 is enabled for the fictional demo businesses only.
insert into public.feature_entitlements(tenant_id,feature,enabled)
select id,'booking',true from public.tenants where is_demo
on conflict (tenant_id,feature) do update set enabled=excluded.enabled;
