import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getAuth } from "./server/data/get-auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.includes("/jobs")) {
    const auth = await getAuth();

    const path = req.nextUrl.pathname;

    console.log("PATH", path);

    if (!auth.authenticated)
      return NextResponse.redirect(new URL("/auth", req.url));

    const { user } = auth;

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
