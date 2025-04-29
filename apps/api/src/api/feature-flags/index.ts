import { FeatureFlag } from "@hireup/common/constants";
import { FlagDetails } from "@hireup/common/types";
import { Elysia } from "elysia";
import { AuthMiddleware } from "~/middleware";
import { db } from "~/packages/db";
import { json } from "~/packages/json";

export const featureFlags = new Elysia({
  name: "Feature Flags Route",
  prefix: "/feature-flags",
})
  .use(db)
  .use(json)
  .use(AuthMiddleware);

featureFlags.get("/", async (ctx) => {
  try {
    const flags = await ctx.db.query.featureFlags.findMany({
      columns: { name: true, status: true },
    });

    const data = flags.reduce(
      (acc, cur) => {
        acc[cur.name as FeatureFlag] = {
          status: cur.status,
          value: cur.status === "disabled" ? false : true,
        };

        return acc;
      },
      {} as Record<FeatureFlag, FlagDetails>
    );

    return ctx.json.stringify({
      success: true,
      data,
    });
  } catch (error) {
    ctx.set.status = 500;

    return ctx.json.stringify({
      success: false,
      error: "Failed to fetch feature flags",
    });
  }
});

featureFlags.get("/me", async (ctx) => {
  try {
    const flags = await ctx.db.query.userFeatureFlags.findFirst({
      where: (featureFlags, { eq }) => eq(featureFlags.userId, ctx.userId),
    });

    if (!flags) {
      ctx.set.status = 401;

      return ctx.json.stringify({
        success: false,
        error: "User not found",
      });
    }

    return ctx.json.stringify({
      success: true,
      data: flags.flags,
    });
  } catch (error) {
    ctx.set.status = 500;

    return ctx.json.stringify({
      success: false,
      error: "Failed to get feature flags",
    });
  }
});
