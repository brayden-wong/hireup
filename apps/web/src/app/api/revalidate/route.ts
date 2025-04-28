import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { Request } from "../utils";

type Data = {
  tags: Array<string>;
};

export async function POST(req: Request<Data>) {
  const { tags } = await req.json();

  const session = req.cookies.get("session_id")?.value;

  if (!session)
    return NextResponse.json(
      { success: false, error: "Invalid session" } as const,
      { status: 401 },
    );

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json(
    {
      success: true,
      data: { revalidated: true, now: Date.now() } as const,
    } as const,
    { status: 200 },
  );
}

export type Revalidate =
  Awaited<ReturnType<typeof POST>> extends NextResponse<infer R> ? R : never;
