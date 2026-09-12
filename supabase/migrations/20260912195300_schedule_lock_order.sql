-- Acquire the shared scheduling lock before existing row locks.
create or replace function public.save_hours(p_tenant uuid, p_subject uuid, p_staff boolean, p_rows jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if private.tenant_role(p_tenant) not in ('owner','manager') or private.tenant_role(p_tenant) is null then raise exception 'Forbidden' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
  if jsonb_array_length(p_rows) <> 7 or (select count(distinct (r->>'weekday')::int) from jsonb_array_elements(p_rows) r) <> 7 then raise exception 'Seven unique weekdays required'; end if;
  if p_staff then
    perform 1 from public.staff_members where tenant_id=p_tenant and id=p_subject for update;
    if not found then raise exception 'Staff not found'; end if;
    delete from public.staff_working_hours where tenant_id=p_tenant and staff_id=p_subject;
    insert into public.staff_working_hours select p_tenant,p_subject,x.* from jsonb_to_recordset(p_rows) as x(weekday int,enabled boolean,start_time time,end_time time,break_start time,break_end time);
  else
    perform 1 from public.locations where tenant_id=p_tenant and id=p_subject for update;
    if not found then raise exception 'Location not found'; end if;
    delete from public.business_hours where tenant_id=p_tenant and location_id=p_subject;
    insert into public.business_hours select p_tenant,p_subject,x.* from jsonb_to_recordset(p_rows) as x(weekday int,enabled boolean,start_time time,end_time time,break_start time,break_end time);
  end if;
end $$;
create or replace function public.save_staff(p_tenant uuid,p_id uuid,p_name text,p_title text,p_bio text,p_active boolean,p_services uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare staff uuid;
begin
  if private.tenant_role(p_tenant) not in ('owner','manager') or private.tenant_role(p_tenant) is null then raise exception 'Forbidden' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
  if p_id is null then
    insert into public.staff_members(tenant_id,display_name,title,bio,active) values(p_tenant,p_name,p_title,p_bio,p_active) returning id into staff;
    insert into public.staff_working_hours select p_tenant,staff,weekday,enabled,start_time,end_time,break_start,break_end from public.business_hours where tenant_id=p_tenant;
  else
    update public.staff_members set display_name=p_name,title=p_title,bio=p_bio,active=p_active where tenant_id=p_tenant and id=p_id returning id into staff;
    if staff is null then raise exception 'Staff not found'; end if;
  end if;
  delete from public.staff_services where tenant_id=p_tenant and staff_id=staff;
  insert into public.staff_services select p_tenant,staff,unnest(p_services);
  return staff;
end $$;
create or replace function public.save_branding(p_tenant uuid,p_name text,p_tagline text,p_description text,p_accent text,p_address text,p_phone text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if private.tenant_role(p_tenant) is distinct from 'owner' then raise exception 'Forbidden' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,7202));
  update public.tenants set name=p_name where id=p_tenant;
  update public.tenant_branding set tagline=p_tagline,description=p_description,accent_color=p_accent where tenant_id=p_tenant;
  update public.locations set address=p_address,phone=p_phone where tenant_id=p_tenant;
end $$;
