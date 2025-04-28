import "server-only";

import { cookies } from "next/headers";

export async function getJar() {
  return await cookies();
}
