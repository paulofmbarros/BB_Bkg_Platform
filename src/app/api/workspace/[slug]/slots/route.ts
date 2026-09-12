import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireManager } from "@/modules/tenancy/context";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { db, tenant } = await requireManager((await params).slug);
  const parsed = z
    .object({ service: z.uuid(), staff: z.uuid(), day: z.iso.date() })
    .safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success)
    return Response.json(
      { error: "Choose a valid service, barber and date." },
      { status: 400 },
    );
  const { data, error } = await db.rpc("owner_booking_slots", {
    p_tenant: tenant.id,
    p_service: parsed.data.service,
    p_staff: parsed.data.staff,
    p_day: parsed.data.day,
  });
  return Response.json(error ? { error: "Could not load times." } : data, {
    status: error ? 400 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
