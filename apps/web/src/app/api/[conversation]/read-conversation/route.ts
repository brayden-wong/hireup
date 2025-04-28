import type { NextRequest } from "next/server";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { request } from "~/lib/utils";

import { isAuthenticated } from "../../utils";
import { CONVERSATION, CONVERSATIONS } from "~/constants/revalidate";
import { env } from "~/env";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversation: string }> },
) {
  const [authenticated, session] = await isAuthenticated(req);

  if (!authenticated)
    return NextResponse.json({ success: false, error: "Unauthorized" });

  const { conversation } = await params;
  console.log("CONVERSATION", conversation);

  const response = await request<"none">(
    `${env.API_URL}/api/conversations/${conversation}/read`,
    {
      session,
      method: "POST",
    },
  );

  if (!response.success) return NextResponse.json(response);

  revalidateTag(`${CONVERSATIONS}:${session}`);
  revalidateTag(`${CONVERSATION}:${conversation}`);

  return NextResponse.json(response);
}

export type ReadConversationResponse =
  Awaited<ReturnType<typeof POST>> extends NextResponse<infer T> ? T : never;
