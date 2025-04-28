import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { isAuthenticated } from "~/app/api/utils";
import { env } from "~/env";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversation: string }> },
) {
  const { searchParams } = req.nextUrl;

  const page = searchParams.get("page");

  if (!page || isNaN(+page))
    return NextResponse.json({ success: false, error: "Invalid page" });

  const [authenticated, session] = await isAuthenticated(req);

  if (!authenticated)
    return NextResponse.json({ success: false, error: "Unauthorized" });

  const { conversation } = await params;

  return fetch(
    `${env.API_URL}/api/conversations/${conversation}/messages?page=${page}`,
    {
      method: "GET",
      headers: {
        "x-session-key": session,
      },
    },
  );
}
