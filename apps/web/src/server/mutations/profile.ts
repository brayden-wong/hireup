"use server";

import { redirect } from "next/navigation";

import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { Profile } from "~/components/auth/profile-form";
import { env } from "~/env";

export async function createProfile(data: Profile) {
  const session = await getSession();

  if (!session) redirect("/");

  return await request<"Profile created", "An error occurred">(
    `${env.API_URL}/api/users/profile`,
    {
      session,
      method: "POST",
      body: JSON.stringify({
        ...data,
        experience: data.experience === "" ? undefined : data.experience,
        resume: data.resume
          ? { key: data.resume.key, url: data.resume.url }
          : undefined,
      }),
    },
  );
}
