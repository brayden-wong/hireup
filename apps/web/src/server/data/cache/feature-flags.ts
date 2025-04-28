import { unstable_cache as cache } from "next/cache";

import { request } from "~/lib/utils";

import { getSession } from "../../utils/get-session";
import { FeatureFlag } from "@hireup/common/constants";
import { FlagDetails } from "@hireup/common/types";
import { FEATURE_FLAGS } from "~/constants/revalidate";
import { env } from "~/env";

export async function getFeatureFlags() {
  const key = await getSession();

  if (!key) return null;

  const fn = cache(
    async () => {
      const start = Date.now();

      const [featureFlags, myFlags] = await Promise.all([
        request<Record<FeatureFlag, FlagDetails>>(
          `${env.API_URL}/api/feature-flags`,
          {
            session: key,
            method: "GET",
          },
        ),
        request<Record<FeatureFlag, FlagDetails>>(
          `${env.API_URL}/api/feature-flags/me`,
          {
            session: key,
            method: "GET",
          },
        ),
      ]);

      console.info("get-feature-flags", `${Date.now() - start}ms`);

      if (!featureFlags.success || !myFlags.success) return null;

      return {
        featureFlags: featureFlags.data,
        flags: myFlags.data,
      };
    },
    [FEATURE_FLAGS],
    { tags: [FEATURE_FLAGS] },
  );

  return await fn();
}
