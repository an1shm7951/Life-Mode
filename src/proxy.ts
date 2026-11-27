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
    "/proof/:path*",
    "/connections/:path*",
    "/discover/:path*",
    "/stories/:path*",
    "/play/:path*",
    "/buddy/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/subscription/:path*",
    "/opportunities/:path*",
    "/schedule/:path*",
    "/plus/:path*",
    "/onboarding/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/forgot-password/:path*",
    "/reset-password/:path*",
  ],
};
