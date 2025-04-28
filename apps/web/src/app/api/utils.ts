import type { NextRequest } from "next/server";

export interface Request<T extends unknown> extends NextRequest {
  json: () => Promise<T>;
}

export async function isAuthenticated<T>(req: Request<T>) {
  const sessionId = req.cookies.get("session_id")?.value;

  // return [!!key, key ?? null] as const;

  if (!!sessionId) return [true, sessionId] as const;

  return [false, null] as const;
}
