"use server";

import { revalidateTag } from "next/cache";

import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { FeatureFlagStatus } from "@hireup/common/constants";
import { FEATURE_FLAGS } from "~/constants/revalidate";
import { env } from "~/env";

type Params = {
  name: string;
  status: FeatureFlagStatus;
};

export async function createFeatureFlag(params: Params) {
  const session = await getSession();

  if (!session) return { success: false, error: "Not logged in" } as const;

  const response = await request<{ name: string; status: FeatureFlagStatus }>(
    `${env.API_URL}/api/feature-flags`,
    {
      session,
      method: "POST",
      body: JSON.stringify(params),
    },
  );

  if (!response.success) return response;

  revalidateTag(FEATURE_FLAGS);
  return response;
}

export async function updateFeatureFlag(params: Params) {
  const session = await getSession();

  if (!session) return { success: false, error: "Not logged in" } as const;

  const response = await request<
    { name: string; status: FeatureFlagStatus },
    `Failed to update feature flag ${string}`
  >(`${env.API_URL}/api/feature-flags`, {
    session,
    method: "PATCH",
    body: JSON.stringify(params),
  });

  if (!response.success) return response;

  revalidateTag(FEATURE_FLAGS);

  return response;
}

export async function deleteFeatureFlag(name: string) {
  const session = await getSession();

  if (!session) return { success: false, error: "Not logged in" } as const;

  const response = await request<{ name: string }>(
    `${env.API_URL}/api/feature-flags`,
    {
      session,
      method: "DELETE",
      body: JSON.stringify({ name }),
    },
  );

  if (!response.success) return response;

  revalidateTag(FEATURE_FLAGS);

  return response;
}
