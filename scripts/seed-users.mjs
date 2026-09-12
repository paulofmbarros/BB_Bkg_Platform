import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Demo users may only be seeded into local Supabase.");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = [
  [
    "owner@porto-gentlemen.example",
    "PortoDemo!2026",
    "11111111-1111-4111-8111-111111111111",
    "owner",
    "50000000-0000-4000-8000-000000000001",
  ],
  [
    "owner@atelier-lisboa.example",
    "LisboaDemo!2026",
    "22222222-2222-4222-8222-222222222222",
    "owner",
    "50000000-0000-4000-8000-000000000002",
  ],
  [
    "staff@porto-gentlemen.example",
    "StaffDemo!2026",
    "11111111-1111-4111-8111-111111111111",
    "staff",
    "50000000-0000-4000-8000-000000000003",
  ],
  [
    "manager@porto-gentlemen.example",
    "ManagerDemo!2026",
    "11111111-1111-4111-8111-111111111111",
    "manager",
    "50000000-0000-4000-8000-000000000004",
  ],
];
const { data: existing, error: listError } = await db.auth.admin.listUsers();
if (listError) throw listError;
for (const [email, password, tenant_id, role, id] of users) {
  let user = existing.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      id,
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db
    .from("tenant_memberships")
    .upsert({ tenant_id, user_id: user.id, role, active: true });
  if (error) throw error;
  if (role === "staff") {
    const { error: linkError } = await db
      .from("staff_members")
      .update({ user_id: user.id })
      .eq("id", "30000000-0000-4000-8000-000000000002");
    if (linkError) throw linkError;
  }
  console.log(`Ready: ${role} account for ${email}`);
}
