import { NextRequest, NextResponse } from "next/server";

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planning/:path*",
    "/goals/:path*",
    "/discover/:path*",
    "/stories/:path*",
    "/play/:path*",
    "/buddy/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/subscription/:path*",
    "/opportunities/:path*",
    "/onboarding/:path*",
  ],
};
