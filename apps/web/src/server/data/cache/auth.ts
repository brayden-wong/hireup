import type { User } from "~/lib/stores/auth-store";
import type { AuthError } from "~/lib/types/auth";

import { unstable_cache as cache } from "next/cache";

import { request } from "~/lib/utils";

import { getSession } from "../../utils/get-session";
import { AUTH } from "~/constants/revalidate";
import { env } from "~/env";

export async function getAuth() {
  const key = await getSession();

  if (!key)
    return { user: null, sessionId: null, authenticated: false as const };

  const fn = cache(
    async () => {
      const start = Date.now();
      const user = await request<
        { user: User } & { sessionId: string },
        AuthError
      >(`${env.API_URL}/api/users/me`, {
        session: key,
        method: "GET",
      });

      console.info(`get-auth: ${Date.now() - start}ms`);

      if (!user.success)
        return { user: null, sessionId: null, authenticated: false as const };

      const { sessionId, user: userData } = user.data;

      return { user: userData, sessionId, authenticated: true as const };
    },
    [`${AUTH}:${key}`],
    { revalidate: 60, tags: [`${AUTH}:${key}`] },
  );

  return await fn();
}
