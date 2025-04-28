import type { Request } from "~/app/api/utils";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { User } from "~/lib/stores/auth-store";
import { unauthenticatedRequest } from "~/lib/utils";

import { AUTH } from "~/constants/revalidate";
import { env } from "~/env";

type Payload = {
  email: string;
  password: string;
};

export async function POST(req: Request<Payload>) {
  const data = await req.json();
  const userAgent = req.headers.get("user-agent");

  const response = await unauthenticatedRequest<SignInSuccess, SignInError>(
    `${env.API_URL}/api/auth/sign-in`,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
    },
  );

  if (!response.success) {
    console.error("ERROR", response.error);

    return NextResponse.json(response, { status: 401 });
  }

  const { maxAge, sessionId, ...user } = response.data;

  const res = NextResponse.json(
    { success: true, data: { ...user, sessionId } } as const,
    {
      status: 201,
    },
  );

  revalidateTag(`${AUTH}:${sessionId}`);

  res.cookies.set("session_id", sessionId, {
    maxAge,
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });

  return res;
}

export type SignInResponse =
  Awaited<ReturnType<typeof POST>> extends NextResponse<infer T> ? T : never;

type SignInSuccess = User & {
  maxAge: number;
  profile: boolean;
  sessionId: string;
};

type SignInError = "User does not exist" | "Invalid user credentials";
