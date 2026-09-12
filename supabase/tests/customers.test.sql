begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
select ok((select reloptions @> array['security_invoker=true'] from pg_class where oid='public.customer_summaries'::regclass),'Customer summary view enforces caller RLS');
select ok(not has_table_privilege('anon','public.customer_summaries','SELECT'),'Guest cannot query customer summaries');
select ok(not has_column_privilege('authenticated','public.customers','email_verified','UPDATE'),'Members cannot verify customer emails directly');
select * from finish();
rollback;
