import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/src/server/auth/constants";

export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/market-movement/:path*",
    "/sector-heatmap/:path*",
    "/index-mover/:path*",
    "/global-markets/:path*",
    "/btst-scanner/:path*",
    "/intraday-boosters/:path*",
    "/breakout-15m/:path*",
    "/fii-dii/:path*",
  ],
};
