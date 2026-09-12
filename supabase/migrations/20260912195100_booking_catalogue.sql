create or replace function private.public_shop(p_hostname text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'booking_enabled',exists(select 1 from public.feature_entitlements e where e.tenant_id=t.id and e.feature='booking' and e.enabled),'name',t.name,'slug',t.slug,'is_demo',t.is_demo,'currency',t.currency,
    'tagline',b.tagline,'description',b.description,'accent_color',b.accent_color,'logo_path',b.logo_path,
    'address',l.address,'phone',l.phone,'timezone',l.timezone,
    'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'duration_minutes',s.duration_minutes,'price_minor',s.price_minor,'category',s.category) order by s.price_minor) from public.services s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'staff',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'display_name',s.display_name,'title',s.title,'bio',s.bio,'service_ids',coalesce((select jsonb_agg(ss.service_id) from public.staff_services ss where ss.tenant_id=s.tenant_id and ss.staff_id=s.id),'[]'::jsonb)) order by s.display_name) from public.staff_members s where s.tenant_id=t.id and s.active),'[]'::jsonb),
    'hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',h.weekday,'enabled',h.enabled,'start_time',h.start_time,'end_time',h.end_time,'break_start',h.break_start,'break_end',h.break_end)) from public.business_hours h where h.tenant_id=t.id),'[]'::jsonb)
  ) from public.tenant_domains d join public.tenants t on t.id=d.tenant_id
  join public.tenant_branding b on b.tenant_id=t.id join public.locations l on l.tenant_id=t.id
  where d.hostname=p_hostname and d.verified_at is not null and t.active;
$$;
