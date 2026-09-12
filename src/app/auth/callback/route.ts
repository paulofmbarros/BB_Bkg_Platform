import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const db = await createSessionClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL("/reset-password", process.env.APP_ORIGIN),
      );
  }
  return NextResponse.redirect(
    new URL("/forgot-password", process.env.APP_ORIGIN),
  );
}
