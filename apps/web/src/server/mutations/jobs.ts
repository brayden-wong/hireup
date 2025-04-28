"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import { TypedError } from "~/lib/data/error";
import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { CreateJob, CreateJobError } from "@hireup/common/responses";
import { NewJob } from "~/app/(main)/recruiter/jobs/new/job-form";
import { MY_JOBS } from "~/constants/revalidate";
import { env } from "~/env";

type CreateJobParams = {
  job: NewJob;
};

export async function createJob({ job }: CreateJobParams) {
  const session = await getSession();

  if (!session) return new TypedError("Unauthorized");

  const response = await request<
    typeof CreateJob,
    (typeof CreateJobError)[number]
  >(`${env.API_URL}/api/jobs/recruiter/new`, {
    session,
    method: "POST",
    body: JSON.stringify(job),
  });

  if (!response.success) return new TypedError(response.error);

  revalidateTag(`${MY_JOBS}:${session}`);

  const jar = await cookies();

  jar.set("update", "", { expires: Date.now() });

  return response.data;
}
