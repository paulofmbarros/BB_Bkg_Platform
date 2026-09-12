import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeHost, isWorkspaceHost } from "@/modules/tenancy/host";

export async function proxy(request: NextRequest) {
  const hostname = normalizeHost(request.headers.get("host") ?? "");
  const origin = process.env.APP_ORIGIN ?? "http://127.0.0.1:3000";
  if (!hostname) return new NextResponse("Unknown domain", { status: 404 });
  const requestHeaders = new Headers(request.headers);
  // Always overwrite this internal header, including on central-host requests.
  requestHeaders.set("x-shop-host", hostname);
  // Host selects a public shop only; private operations still require membership.
  if (
    !isWorkspaceHost(hostname, origin) &&
    !(process.env.NODE_ENV === "development" && hostname === "localhost")
  ) {
    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      !(
        request.method === "POST" && request.nextUrl.pathname === "/api/booking"
      )
    )
      return new NextResponse("Method not allowed", { status: 405 });
    if (
      !["/", "/book", "/manage", "/api/booking"].includes(
        request.nextUrl.pathname,
      )
    )
      return new NextResponse("Not found", { status: 404 });
    const publicResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    publicResponse.headers.set("Cache-Control", "private, no-store");
    return publicResponse;
  }
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
