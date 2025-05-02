import { unstable_cache as cache } from "next/cache";

import { request } from "~/lib/utils";

import { getSession } from "../../utils/get-session";
import { FeatureFlagStatus } from "@hireup/common/constants";
import { FEATURE_FLAGS } from "~/constants/revalidate";
import { env } from "~/env";

export async function getUserFeatureFlags() {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const flags = await request<Record<string, FeatureFlagStatus>>(
        `${env.API_URL}/api/feature-flags`,
        {
          session,
          method: "GET",
        },
      );

      if (!flags.success) return null;

      const betaFlag = Object.values(flags.data).some(
        (status) => status === "beta",
      );

      if (betaFlag) {
        const betaUser = await request<boolean, "User not found">(
          `${env.API_URL}/api/feature-flags/beta-user`,
          {
            session,
            method: "GET",
          },
        );

        if (!betaUser.success) return null;

        console.info("get-feature-flags", `${Date.now() - start}ms`);

        return {
          featureFlags: flags.data,
          betaUser: betaUser.data,
        };
      }

      console.info("get-feature-flags", `${Date.now() - start}ms`);

      return {
        featureFlags: flags.data,
        betaUser: false,
      };
    },
    [`${FEATURE_FLAGS}:${session}`, FEATURE_FLAGS],
    { tags: [`${FEATURE_FLAGS}:${session}`, FEATURE_FLAGS] },
  );

  const data = await fn();

  console.log("UNSORTED", data);

  if (!data) return null;

  const flags: Record<string, FeatureFlagStatus> = {
    jobs: "disabled",
    conversations: "disabled",
  };

  for (const [flag, status] of Object.entries(data.featureFlags)) {
    flags[flag] =
      status === "beta" ? (data.betaUser ? "beta" : "disabled") : status;
  }

  const sorted = Object.fromEntries(
    Object.entries(flags).sort((a, b) => a[0].localeCompare(b[0])),
  );

  console.log("SORTED", sorted);

  return sorted;
}

export async function getFeatureFlags() {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const flags = await request<Record<string, FeatureFlagStatus>>(
        `${env.API_URL}/api/feature-flags`,
        {
          session,
          method: "GET",
        },
      );

      if (!flags.success) return null;

      console.info("get-feature-flags", `${Date.now() - start}ms`);

      const sorted = Object.fromEntries(
        Object.entries(flags.data).sort((a, b) => a[0].localeCompare(b[0])),
      );

      console.log("SORTED", sorted);

      return sorted;
    },
    [FEATURE_FLAGS],
    { tags: [FEATURE_FLAGS] },
  );

  return await fn();
}
