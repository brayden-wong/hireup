import { User } from "~/lib/stores/auth-store";
import { AuthError } from "~/lib/types/auth";
import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { env } from "~/env";

export async function getAuth() {
  const key = await getSession();

  if (!key)
    return { user: null, sessionId: null, authenticated: false as const };

  const user = await request<{ user: User } & { sessionId: string }, AuthError>(
    `${env.API_URL}/api/users/me`,
    {
      session: key,
      method: "GET",
      cache: "no-store",
    },
  );

  if (!user.success)
    return { user: null, sessionId: null, authenticated: false as const };

  const { sessionId, user: userData } = user.data;

  return { user: userData, sessionId, authenticated: true as const };
}
