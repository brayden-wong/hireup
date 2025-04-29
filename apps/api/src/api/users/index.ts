import Elysia from "elysia";
import { USER_NOT_FOUND } from "~/constants/errors";
import { AuthMiddleware } from "~/middleware";
import { db } from "~/packages/db";
import { json } from "~/packages/json";
import { profile } from "./profile";

export const users = new Elysia({ name: "Users Route", prefix: "/users" })
  .use(db)
  .use(json)
  .use(AuthMiddleware);

users.get("/me", async (ctx) => {
  const user = await ctx.db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, ctx.userId),
    columns: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      account: true,
    },
  });

  if (!user)
    throw ctx.error(
      "Not Found",
      ctx.json.stringify({ success: false, error: USER_NOT_FOUND })
    );

  const data = {
    user: user,
    sessionId: ctx.id,
  };

  return ctx.json.stringify({ success: true, data });
});

users.use(profile);
