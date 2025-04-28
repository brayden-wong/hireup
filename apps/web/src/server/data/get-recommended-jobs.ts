import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { UserRecommendedJobs } from "@hireup/common/responses";
import { env } from "~/env";

export async function getRecommendedJobs() {
  const session = await getSession();

  if (!session) return null;

  const response = await request<UserRecommendedJobs[]>(
    `${env.API_URL}/api/jobs/user/recommended-jobs`,
    {
      session,
      method: "GET",
    },
  );

  return response.success ? response.data : response.error;
}
