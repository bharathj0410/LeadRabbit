import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("appToken")?.value;

  // Allow public access to login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // If no token and trying to access protected routes
  if (!token) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";

    return NextResponse.redirect(loginUrl);
  }

  // If token exists, decode it
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role;

    // If accessing root '/', redirect to /user or /admin
    if (pathname === "/") {
      const redirectUrl = request.nextUrl.clone();

      redirectUrl.pathname = `/${role}`;

      return NextResponse.redirect(redirectUrl);
    }

    // Protect role-specific routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      const forbiddenUrl = request.nextUrl.clone();

      forbiddenUrl.pathname = "/403";

      return NextResponse.redirect(forbiddenUrl);
    }

    if (pathname.startsWith("/user") && role !== "user") {
      const forbiddenUrl = request.nextUrl.clone();

      forbiddenUrl.pathname = "/403";

      return NextResponse.redirect(forbiddenUrl);
    }

    return NextResponse.next();
  } catch (err) {
    // Token invalid → redirect to login
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";

    return NextResponse.redirect(loginUrl);
  }
}
export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*", "/login"],
};
