import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
export async function GET() {
  try {
    const { error } = await createPublicClient()
      .rpc("get_public_shop", { p_hostname: "healthcheck.invalid" })
      .abortSignal(AbortSignal.timeout(3000));
    if (error) throw error;
    return NextResponse.json(
      { status: "ok", version: "0.1.0" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
