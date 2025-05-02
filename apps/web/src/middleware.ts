import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { ADMIN_ROUTES } from "./constants/middleware-routes";
import { getAuth } from "./server/data/get-auth";

export async function middleware(req: NextRequest) {
  if (ADMIN_ROUTES.includes(req.nextUrl.pathname)) {
    const auth = await getAuth();

    if (!auth.authenticated)
      return NextResponse.redirect(new URL("/auth", req.url));

    const { user } = auth;

    if (user.account !== "admin")
      return NextResponse.redirect(new URL("/auth", req.url));

    return NextResponse.rewrite(
      new URL(`/admin${req.nextUrl.pathname}`, req.url),
    );
  }

  if (req.nextUrl.pathname.includes("/jobs")) {
    const auth = await getAuth();

    const path = req.nextUrl.pathname;

    if (!auth.authenticated)
      return NextResponse.redirect(new URL("/auth", req.url));

    const { user } = auth;

    if (user.account === "admin")
      return NextResponse.rewrite(new URL(`/admin${path}`, req.url));

    if (user.account === "recruiter")
      return NextResponse.rewrite(new URL(`/recruiter${path}`, req.url));

    return NextResponse.rewrite(new URL(`/user${path}`, req.url));
  }

  const pathname =
    req.nextUrl.pathname === "/auth"
      ? (req.headers.get("referer") ?? "/feed")
      : req.nextUrl.pathname === "/"
        ? "/feed"
        : req.nextUrl.pathname;

  const response = NextResponse.next();

  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};
