SET local check_function_bodies = off;

DROP POLICY "manager_delete" ON "public"."availability_exceptions";

DROP POLICY "manager_insert" ON "public"."availability_exceptions";

DROP POLICY "manager_update" ON "public"."availability_exceptions";

DROP POLICY "manager_delete" ON "public"."business_hours";

DROP POLICY "manager_insert" ON "public"."business_hours";

DROP POLICY "manager_update" ON "public"."business_hours";

DROP POLICY "owner_update" ON "public"."locations";

DROP POLICY "manager_delete" ON "public"."services";

DROP POLICY "manager_insert" ON "public"."services";

DROP POLICY "manager_update" ON "public"."services";

DROP POLICY "manager_delete" ON "public"."staff_members";

DROP POLICY "manager_insert" ON "public"."staff_members";

DROP POLICY "manager_update" ON "public"."staff_members";

DROP POLICY "manager_delete" ON "public"."staff_services";

DROP POLICY "manager_insert" ON "public"."staff_services";

DROP POLICY "manager_update" ON "public"."staff_services";

DROP POLICY "manager_delete" ON "public"."staff_working_hours";

DROP POLICY "manager_insert" ON "public"."staff_working_hours";

DROP POLICY "manager_update" ON "public"."staff_working_hours";

DROP POLICY "owner_update" ON "public"."tenant_branding";

DROP POLICY "tenant_update" ON "public"."tenants";

CREATE OR REPLACE FUNCTION private.can_manage (
  p_tenant uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select coalesce(private.tenant_role(p_tenant) in ('owner','manager') and exists(
    select 1 from public.feature_entitlements where tenant_id=p_tenant and feature='foundation' and enabled
  ),false);
$function$;

CREATE POLICY "manager_delete" ON "public"."availability_exceptions"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."availability_exceptions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."availability_exceptions"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_delete" ON "public"."business_hours"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."business_hours"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."business_hours"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "owner_update" ON "public"."locations"
  FOR UPDATE
  TO "authenticated"
  USING (((private.tenant_role(tenant_id) = 'owner'::public.member_role) AND private.can_manage(tenant_id)))
  WITH CHECK (((private.tenant_role(tenant_id) = 'owner'::public.member_role) AND private.can_manage(tenant_id)));

CREATE POLICY "manager_delete" ON "public"."services"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."services"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."services"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_delete" ON "public"."staff_members"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."staff_members"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."staff_members"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_delete" ON "public"."staff_services"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."staff_services"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."staff_services"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_delete" ON "public"."staff_working_hours"
  FOR DELETE
  TO "authenticated"
  USING (private.can_manage(tenant_id));

CREATE POLICY "manager_insert" ON "public"."staff_working_hours"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "manager_update" ON "public"."staff_working_hours"
  FOR UPDATE
  TO "authenticated"
  USING (private.can_manage(tenant_id))
  WITH CHECK (private.can_manage(tenant_id));

CREATE POLICY "owner_update" ON "public"."tenant_branding"
  FOR UPDATE
  TO "authenticated"
  USING (((private.tenant_role(tenant_id) = 'owner'::public.member_role) AND private.can_manage(tenant_id)))
  WITH CHECK (((private.tenant_role(tenant_id) = 'owner'::public.member_role) AND private.can_manage(tenant_id)));

CREATE POLICY "tenant_update" ON "public"."tenants"
  FOR UPDATE
  TO "authenticated"
  USING (((private.tenant_role(id) = 'owner'::public.member_role) AND private.can_manage(id)))
  WITH CHECK (((private.tenant_role(id) = 'owner'::public.member_role) AND private.can_manage(id)));

REVOKE ALL ON FUNCTION "private"."can_manage"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."can_manage"(uuid) TO "authenticated", "postgres";

REVOKE ALL ("active") ON TABLE "public"."staff_members" FROM "authenticated";

GRANT INSERT ("active"), UPDATE ("active") ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ("bio") ON TABLE "public"."staff_members" FROM "authenticated";

GRANT INSERT ("bio"), UPDATE ("bio") ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ("display_name") ON TABLE "public"."staff_members" FROM "authenticated";

GRANT INSERT ("display_name"), UPDATE ("display_name") ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ("tenant_id") ON TABLE "public"."staff_members" FROM "authenticated";

GRANT INSERT ("tenant_id") ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."staff_members" FROM "authenticated";

GRANT INSERT ("title"), UPDATE ("title") ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ("name") ON TABLE "public"."tenants" FROM "authenticated";

GRANT UPDATE ("name") ON TABLE "public"."tenants" TO "authenticated";
