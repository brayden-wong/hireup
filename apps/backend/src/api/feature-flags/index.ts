import { FeatureFlag, FeatureFlagStatus } from "@hireup/common/constants";
import { FlagDetails } from "@hireup/common/types";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { AdminMiddleware, AuthMiddleware } from "~/middleware";
import { db, schema } from "~/packages/db";
import { json } from "~/packages/json";

const FeatureFlagValue = t.Optional(
  t.Union([
    t.Literal("enabled"),
    t.Literal("disabled"),
    t.Literal("beta"),
    t.Literal("soon"),
    t.Literal("new"),
  ])
);

const Model = new Elysia({ name: "Model" }).model({
  post: t.Object({
    name: t.String({ minLength: 3, maxLength: 64, regex: /^[a-z0-9-]+$/ }),
    status: FeatureFlagValue,
  }),
  patch: t.Object({
    name: t.String(),
    status: FeatureFlagValue,
  }),
  delete: t.Object({
    name: t.String(),
  }),
});

export const featureFlags = new Elysia({
  name: "Feature Flags Route",
  prefix: "/feature-flags",
})
  .use(db)
  .use(json)
  .use(Model);

featureFlags.use(AuthMiddleware).get("/", async (ctx) => {
  try {
    const flags = await ctx.db.query.featureFlags.findMany({
      columns: { name: true, status: true },
    });

    const data = flags.reduce(
      (acc, cur) => {
        acc[cur.name as FeatureFlag] = cur.status;

        return acc;
      },
      {} as Record<FeatureFlag, FeatureFlagStatus>
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

featureFlags.use(AuthMiddleware).get("/beta-user", async (ctx) => {
  const user = await ctx.db.query.users.findFirst({
    columns: {
      id: true,
      account: true,
      betaUser: true,
    },
    where: (users, { eq }) => eq(users.id, ctx.userId),
  });

  if (!user) {
    throw ctx.error(
      "Not Found",
      ctx.json.stringify({ success: false, error: "User not found" })
    );
  }

  return ctx.json.stringify({
    success: true,
    data: user.betaUser || user.account == "admin",
  });
});

featureFlags.use(AdminMiddleware).post(
  "/",
  async (ctx) => {
    const { name, status } = ctx.body;

    try {
      await ctx.db
        .insert(schema.featureFlags)
        .values({ name, status })
        .onConflictDoNothing({ target: schema.featureFlags.name });
    } catch (error) {
      console.error(`Error creating feature flag ${name}\n`, error);

      throw ctx.error(
        "Internal Server Error",
        ctx.json.stringify({
          success: false,
          error: `Failed to create feature flag ${name}`,
        })
      );
    } finally {
      return ctx.json.stringify({
        success: true,
        data: {
          name,
          status,
        },
      });
    }
  },
  { body: "post" }
);

featureFlags.patch(
  "/",
  async (ctx) => {
    const { name, status } = ctx.body;

    try {
      await ctx.db
        .update(schema.featureFlags)
        .set({ status })
        .where(eq(schema.featureFlags.name, name));
    } catch (error) {
      console.error(`Error updating feature flag ${name}\n`, error);

      throw ctx.error(
        "Internal Server Error",
        ctx.json.stringify({
          success: false,
          error: `Failed to update feature flag ${name}`,
        })
      );
    } finally {
      return ctx.json.stringify({
        success: true,
        data: {
          name,
          status,
        },
      });
    }
  },
  { body: "patch" }
);

featureFlags.use(AdminMiddleware).delete(
  "/",
  async (ctx) => {
    const { name } = ctx.body;

    try {
      await ctx.db
        .delete(schema.featureFlags)
        .where(eq(schema.featureFlags.name, name));
    } catch (error) {
      console.error(`Error deleting feature flag ${name}\n`, error);

      throw ctx.error(
        "Internal Server Error",
        ctx.json.stringify({
          success: false,
          error: `Failed to delete feature flag ${name}`,
        })
      );
    } finally {
      return ctx.json.stringify({
        success: true,
        data: { name },
      });
    }
  },
  { body: "delete" }
);
