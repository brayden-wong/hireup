import "server-only";

import { getJar } from "./jar";

export async function getSession() {
  const jar = await getJar();

  const sessionId = jar.get("session_id")?.value;

  if (!sessionId) return null;

  return sessionId;
}
