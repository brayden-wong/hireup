import { Elysia, t } from "elysia";
import { password as generateHash } from "bun";
import { AuthModel } from "~/packages/models/auth";
import { db, schema } from "~/packages/db";
import { expires } from "~/utils/expires";
import { eq } from "drizzle-orm";
import {
  INVALID_CREDENTIALS,
  USER_EXISTS,
  USER_NOT_FOUND,
} from "~/constants/errors";
import { json } from "~/packages/json";
import { AuthMiddleware } from "~/middleware";

export const auth = new Elysia({ name: "Auth Route", prefix: "/auth" })
  .use(db)
  .use(json)
  .use(AuthModel);

auth.post(
  "/sign-up",
  async (ctx) => {
    const { email, password, ...data } = ctx.body;

    const user = await ctx.db.query.users.findFirst({
      columns: { id: true },
      where: (users, { eq }) => eq(users.email, email.toLowerCase()),
    });

    if (user)
      throw ctx.error(
        "Conflict",
        ctx.json.stringify({
          success: false,
          error: USER_EXISTS,
        })
      );

    const hash = await generateHash.hash(password);

    try {
      await ctx.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(schema.users)
          .values({
            ...data,
            password: hash,
            email: email.toLowerCase(),
          })
          .returning({ id: schema.users.id });

        if (!user)
          throw ctx.error(
            "Internal Server Error",
            ctx.json.stringify({
              success: false,
              error: "Failed to create user",
            })
          );

        await tx.insert(schema.userFeatureFlags).values({
          userId: user.id,
          flags: {
            jobs: {
              value: true,
              status: "soon",
            },
            conversations: {
              value: true,
              status: "new",
            },
          },
        });
      });

      ctx.set.status = 201;

      return ctx.json.stringify({
        success: true,
        message: "User registered successfully",
      });
    } catch (error) {
      throw ctx.error(
        422,
        ctx.json.stringify({ success: false, error: "Failed to register user" })
      );
    }
  },
  { body: "sign_up" }
);

auth.post(
  "/sign-in",
  async (ctx) => {
    const { email, password } = ctx.body;
    const result = await ctx.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase()),
        with: {
          profile: true,
        },
      });

      if (!user)
        throw ctx.error(
          "Conflict",
          ctx.json.stringify({
            success: false,
            error: USER_NOT_FOUND,
          })
        );

      const valid = await generateHash.verify(password, user.password);

      if (!valid)
        throw ctx.error(
          "Unauthorized",
          ctx.json.stringify({
            success: false,
            error: INVALID_CREDENTIALS,
          })
        );

      const userAgent = ctx.request.headers.get("user-agent") ?? "unknown";
      const ip = ctx.request.headers.get("x-forwarded-for") ?? "unknown";

      const session = await tx.query.sessions.findFirst({
        where: (sessions, { eq, and }) =>
          and(eq(sessions.userId, user.id), eq(sessions.userAgent, userAgent)),
      });

      const data = {
        slug: user.slug,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile ? true : false,
      };

      if (!session) {
        const maxAge = 365 * 24 * 60 * 60;
        const [session] = await tx
          .insert(schema.sessions)
          .values({
            userAgent,
            ipAddress: ip,
            isValid: true,
            userId: user.id,
            expiresAt: expires(maxAge * 1000),
          })
          .returning({ id: schema.sessions.id });

        return {
          success: true,
          data: {
            ...data,
            maxAge,
            sessionId: session.id,
          },
        };
      }

      await tx
        .update(schema.sessions)
        .set({
          lastActive: new Date(),
        })
        .where(eq(schema.sessions.id, session.id));

      return {
        success: true,
        data: {
          ...data,
          sessionId: session.id,
          maxAge: session.expiresAt.getTime() - Date.now(),
        },
      };
    });

    return ctx.json.stringify(result);
  },
  { body: "sign_in" }
);

auth.use(AuthMiddleware).get("/verify-session", async (ctx) => {
  return ctx.json.stringify({
    success: true,
  });
});
