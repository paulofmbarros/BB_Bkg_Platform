SET local check_function_bodies = off;

REVOKE ALL ON TABLE "public"."tenant_memberships" FROM "anon";

REVOKE ALL ON TABLE "public"."tenants" FROM "anon";

CREATE OR REPLACE FUNCTION private.prevent_tenant_move()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if new.tenant_id is distinct from old.tenant_id then raise exception 'Tenant ownership is immutable' using errcode='42501'; end if;
  return new;
end $function$;

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.availability_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.staff_services
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.staff_working_hours
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

CREATE TRIGGER immutable_tenant
  BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_tenant_move();

REVOKE ALL ON FUNCTION "private"."prevent_tenant_move"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."prevent_tenant_move"() TO "postgres";

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

REVOKE ALL ON TABLE "public"."staff_members" FROM "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."staff_members" TO "authenticated";

REVOKE ALL ON TABLE "public"."tenant_memberships" FROM "authenticated";

GRANT SELECT ON TABLE "public"."tenant_memberships" TO "authenticated";

REVOKE ALL ON TABLE "public"."tenants" FROM "authenticated";

GRANT SELECT ON TABLE "public"."tenants" TO "authenticated";
