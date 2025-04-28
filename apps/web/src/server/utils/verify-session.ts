import { request } from "~/lib/utils";

import { getSession } from "./get-session";
import { env } from "~/env";

export async function verifySession() {
  const session = await getSession();

  if (!session) return false;

  const response = await request(`${env.API_URL}/api/auth/verify-session`, {
    session,
    method: "GET",
  });

  if (!response.success) return false;

  return true;
}
