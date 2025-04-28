import "server-only";
import { unstable_cache as cache, revalidateTag } from "next/cache";

import { request } from "~/lib/utils";

import { getSession } from "../../utils/get-session";
import { GetRecuiterJobs } from "@hireup/common/responses";
import {
  MY_JOBS,
  RECRUITER_JOBS,
  USER_SEARCH_JOBS,
} from "~/constants/revalidate";
import { env } from "~/env";

export async function getRecuiterJob(slug: string) {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const response = await request<GetRecuiterJobs, "Job not found">(
        `${env.API_URL}/api/jobs/recruiter/${slug}`,
        {
          session,
          method: "GET",
        },
      );

      console.info(`get-recuiter-job: ${Date.now() - start}ms`);

      return response.success ? response.data : response.error;
    },
    [`${RECRUITER_JOBS}:${slug}`],
    { tags: [`${RECRUITER_JOBS}:${slug}`] },
  );

  return await fn();
}

export async function getJob(slug: string) {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const response = await request<GetRecuiterJobs, "Job not found">(
        `${env.API_URL}/api/jobs/user/${slug}`,
        {
          session,
          method: "GET",
        },
      );

      console.info(`get-job: ${Date.now() - start}ms`);

      return response.success ? response.data : response.error;
    },
    [`${USER_SEARCH_JOBS}:${slug}`],
    { tags: [`${USER_SEARCH_JOBS}:${slug}`] },
  );

  return await fn();
}

export async function getMyJobs() {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const response = await request<GetRecuiterJobs[]>(
        `${env.API_URL}/api/jobs/recruiter/me`,
        { session, method: "GET" },
      );

      console.info(`get-my-jobs: ${Date.now() - start}ms`);

      return response.success ? response.data : response.error;
    },
    [`${MY_JOBS}:${session}`],
    { tags: [`${MY_JOBS}:${session}`] },
  );

  return await fn();
}
