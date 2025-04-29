import { Elysia, t } from "elysia";
import {
  SESSION_NOT_FOUND,
  SESSION_NOT_PROVIDED,
  UNAUTHORIZED_ROLE,
} from "~/constants/errors";
import { dbFunctions } from "~/packages/db";
import { json } from "~/packages/json";

export const AuthMiddleware = new Elysia({ name: "Auth Middleware" })
  .use(json)
  .use(dbFunctions)
  .guard({
    as: "scoped",
    headers: t.Object({
      "x-session-key": t.String(),
    }),
  })
  .resolve({ as: "scoped" }, async (ctx) => {
    const sessionId = ctx.headers["x-session-key"];

    if (!sessionId)
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_PROVIDED,
        })
      );

    const session = await ctx.db_functions.getSession(sessionId);

    if (!session) {
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_FOUND,
        })
      );
    }

    return session;
  });

export const RecruiterMiddleware = new Elysia({ name: "Recruiter Middleware" })
  .use(json)
  .use(dbFunctions)
  .guard({
    as: "scoped",
    headers: t.Object({
      "x-session-key": t.String(),
    }),
  })
  .resolve({ as: "scoped" }, async (ctx) => {
    const sessionId = ctx.headers["x-session-key"];

    if (!sessionId)
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_PROVIDED,
        })
      );

    const session = await ctx.db_functions.getSession(sessionId);

    if (!session) {
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_FOUND,
        })
      );
    }

    if (session.account !== "recruiter")
      return ctx.error(
        403,
        ctx.json.stringify({
          success: false,
          error: UNAUTHORIZED_ROLE,
        })
      );

    return session;
  });

export const UserMiddleware = new Elysia({ name: "Recruiter Middleware" })
  .use(json)
  .use(dbFunctions)
  .guard({
    as: "scoped",
    headers: t.Object({
      "x-session-key": t.String(),
    }),
  })
  .resolve({ as: "scoped" }, async (ctx) => {
    const sessionId = ctx.headers["x-session-key"];

    if (!sessionId)
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_PROVIDED,
        })
      );

    const session = await ctx.db_functions.getSession(sessionId);

    if (!session) {
      return ctx.error(
        "Unauthorized",
        ctx.json.stringify({
          success: false,
          error: SESSION_NOT_FOUND,
        })
      );
    }

    if (session.account !== "user")
      return ctx.error(
        403,
        ctx.json.stringify({
          success: false,
          error: UNAUTHORIZED_ROLE,
        })
      );

    return session;
  });
