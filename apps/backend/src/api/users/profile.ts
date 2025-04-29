import { EXPERIENCE } from "@hireup/common/constants";
import { Elysia, t } from "elysia";
import { AuthMiddleware } from "~/middleware";
import { db, schema } from "~/packages/db";
import { json } from "~/packages/json";

const _model = new Elysia({ name: "Profile Model" }).model({
  create_profile: t.Object({
    bio: t.String({
      maxLength: 500,
      error: "bio cannot exceed 500 caharacters",
    }),
    experience: t.Nullable(t.Union(EXPERIENCE.map((e) => t.Literal(e)))),
    skills: t.Array(t.String()),
    location: t.String({
      maxLength: 64,
      error: "location cannot exceed 64 characters",
    }),
    portfolioUrl: t.String({ url: true }),
    resume: t.Optional(
      t.Object({
        key: t.String(),
        url: t.String({ url: true }),
      })
    ),
  }),
});

export const profile = new Elysia({
  name: "Profile Route",
  prefix: "/profile",
})
  .use(db)
  .use(json)
  .use(_model)
  .use(AuthMiddleware);

profile.post(
  "/",
  async (ctx) => {
    const userId = ctx.userId;

    const { skills, ...data } = ctx.body;

    try {
      await ctx.db.transaction(async (tx) => {
        await tx.insert(schema.profiles).values({
          userId,
          ...data,
          experience: data.experience ?? "none",
        });

        await tx
          .insert(schema.skills)
          .values(skills.map((skill) => ({ name: skill })))
          .onConflictDoNothing();

        const skillIds = await tx.query.skills.findMany({
          columns: { id: true },
          where: (skillTable, { inArray }) => inArray(skillTable.name, skills),
        });

        const userSkills = skillIds.map(({ id }) => ({ userId, skillId: id }));

        await tx.insert(schema.userSkills).values(userSkills);
      });

      return ctx.json.stringify({ success: true, data: "Profile created" });
    } catch (error) {
      console.error("ERROR", error);

      return ctx.json.stringify({
        success: false,
        error: "An error occurred",
      });
    }
  },
  { body: "create_profile" }
);
