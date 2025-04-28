import { NextResponse } from "next/server";
import { isAuthenticated, Request } from "~/app/api/utils";
import { env } from "~/env";

export async function POST(req: Request<{ name: string }>) {
  const [authenticated, key] = await isAuthenticated(req);

  if (!authenticated || !key)
    return NextResponse.json(
      { success: false, error: "Unauthorized" } as const,
      { status: 400 },
    );

  const { name } = await req.json();

  const response = await fetch(
    `${env.API_URL}/api/conversations/find-users?name=${name}`,
    {
      method: "GET",
      headers: {
        "x-session-key": key,
      },
    },
  );

  return response;
}
