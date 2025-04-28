"use server";

import { getJar } from "../utils/jar";

export async function setSessionId(sessionId: string) {
  const jar = await getJar();

  jar.set("session_id", sessionId, {
    path: "/",
    httpOnly: true,
    value: sessionId,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}
