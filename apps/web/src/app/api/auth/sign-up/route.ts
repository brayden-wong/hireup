import { NextResponse } from "next/server";
import type { Request } from "~/app/api/utils";
import { env } from "~/env";
import { unauthenticatedRequest } from "~/lib/utils";

type Payload = {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  account: "user" | "recruiter";
};

export async function POST(req: Request<Payload>) {
  const data = JSON.stringify(await req.json());

  const response = await unauthenticatedRequest<SignUpSuccess, SignUpError>(
    `${env.API_URL}/api/auth/sign-up`,
    {
      body: data,
      method: "POST",
    },
  );

  if (!response.success) console.error(response.error);

  return NextResponse.json(response);
}

export type SignUpResponse =
  Awaited<ReturnType<typeof POST>> extends NextResponse<infer T> ? T : never;

type SignUpSuccess = "User registered successfully";

type SignUpError = "User already exists";
