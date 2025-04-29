import {
  EXPERIENCE,
  JOB_ENVIRONMENTS,
  JOB_TYPES,
} from "@hireup/common/constants";
import {
  CreateJob,
  CreateJobError,
  GetMyJobsError,
} from "@hireup/common/responses";
import { Elysia, t } from "elysia";
import {
  AuthMiddleware,
  RecruiterMiddleware,
  UserMiddleware,
} from "~/middleware";
import { db, schema } from "~/packages/db";
import { json } from "~/packages/json";
import { getRecommendedJobs } from "./recommended-jobs";

const Model = new Elysia({ name: "Jobs Model" }).model({
  new: t.Object({
    title: t.String({
      minLength: 1,
      error: "Title is required",
    }),
    company: t.Union([
      t.Literal(""),
      t.String({
        minLength: 1,
        error: "Company is too short",
      }),
    ]),
    skills: t.Array(t.String()),
    description: t.String({ minLength: 1, error: "Description is required" }),
    relativeExperience: t.Union(EXPERIENCE.map((exp) => t.Literal(exp))),
    location: t.String({ minLength: 1, error: "Location is required" }),
    type: t.Union(JOB_TYPES.map((type) => t.Literal(type))),
    environment: t.Union(JOB_ENVIRONMENTS.map((env) => t.Literal(env))),
    salaryMin: t.Number({ minimum: 0, error: "Salary min is invalid" }),
    salaryMax: t.Optional(t.Number({ error: "Salary max is invalid" })),
    applicationUrl: t.Union([t.Literal(""), t.String({ format: "uri" })]),
  }),
});

const recruiter = new Elysia({
  name: "Recruiter Job Route",
  prefix: "/recruiter",
})
  .use(db)
  .use(json)
  .use(Model)
  .use(RecruiterMiddleware);

recruiter.get("/me", async (ctx) => {
  try {
    const jobs = await ctx.db.query.jobs.findMany({
      where: (jobs, { eq }) => eq(jobs.userId, ctx.userId),
      columns: {
        id: true,
        slug: true,
        title: true,
        userId: true,
        company: true,
        description: true,
        location: true,
        type: true,
        environment: true,
        salaryMin: true,
        salaryMax: true,
        applicationUrl: true,
        createdAt: true,
        isActive: true,
      },
      with: {
        applicants: {
          columns: {
            id: true,
            jobId: true,
            userId: true,
            status: true,
            resumeUrl: true,
            portfolioUrl: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                slug: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    console.log(jobs);

    return ctx.json.stringify({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Failed to get jobs:", error);

    throw ctx.error(
      500,
      ctx.json.stringify({
        success: false,
        error: GetMyJobsError[0],
      })
    );
  }
});

recruiter.get(
  "/:slug",
  async (ctx) => {
    const job = await ctx.db.query.jobs.findFirst({
      where: (jobs, { eq, and }) =>
        and(eq(jobs.userId, ctx.userId), eq(jobs.slug, ctx.params.slug)),
      columns: {
        id: true,
        slug: true,
        title: true,
        userId: true,
        company: true,
        description: true,
        location: true,
        type: true,
        environment: true,
        salaryMin: true,
        salaryMax: true,
        applicationUrl: true,
        createdAt: true,
        isActive: true,
      },
      with: {
        applicants: {
          columns: {
            id: true,
            jobId: true,
            userId: true,
            status: true,
            resumeUrl: true,
            coverLetterUrl: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                slug: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!job)
      throw ctx.error(
        404,
        ctx.json.stringify({ success: false, error: "Job not found" })
      );

    return ctx.json.stringify({ success: true, data: job });
  },
  {
    params: t.Object({
      slug: t.String(),
    }),
  }
);

recruiter.post(
  "/new",
  async (ctx) => {
    try {
      console.log("Creating job:", ctx.body);
      await ctx.db.transaction(async (tx) => {
        const { skills, ...data } = ctx.body;

        const [job] = await tx
          .insert(schema.jobs)
          .values({
            ...data,
            userId: ctx.userId,
          })
          .returning({ id: schema.jobs.id });

        if (!job)
          throw ctx.error(
            500,
            ctx.json.stringify({
              success: false,
              error: "Failed to create job",
            })
          );

        await tx
          .insert(schema.skills)
          .values(skills.map((skill) => ({ name: skill })))
          .onConflictDoNothing();

        const skillIds = await tx.query.skills.findMany({
          columns: { id: true },
          where: (skillTable, { inArray }) => inArray(skillTable.name, skills),
        });

        const jobSkills = skillIds.map(({ id }) => ({
          jobId: job.id,
          skillId: id,
        }));

        await tx.insert(schema.jobSkills).values(jobSkills);
      });

      return ctx.json.stringify({
        success: true,
        data: CreateJob,
      });
    } catch (error) {
      console.error("Creating job failed:", error);

      throw ctx.error(
        500,
        ctx.json.stringify({
          success: false,
          error: CreateJobError[1],
        })
      );
    }
  },
  { body: "new" }
);

const user = new Elysia({ name: "User Job Route", prefix: "/user" })
  .use(db)
  .use(json)
  .use(Model)
  .use(UserMiddleware);

user.get(
  "/:slug",
  async (ctx) => {
    const job = await ctx.db.query.jobs.findFirst({
      where: (jobs, { eq }) => eq(jobs.slug, ctx.params.slug),
      columns: {
        id: true,
        slug: true,
        title: true,
        userId: true,
        company: true,
        description: true,
        location: true,
        type: true,
        environment: true,
        salaryMin: true,
        salaryMax: true,
        applicationUrl: true,
        createdAt: true,
        isActive: true,
      },
      with: {
        applicants: {
          columns: {
            id: true,
            jobId: true,
            userId: true,
            status: true,
            resumeUrl: true,
            coverLetterUrl: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                slug: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!job)
      throw ctx.error(
        404,
        ctx.json.stringify({ success: false, error: "Job not found" })
      );

    return ctx.json.stringify({ success: true, data: job });
  },
  {
    params: t.Object({ slug: t.String() }),
  }
);

user.get("/recommended-jobs", async (ctx) => {
  const jobs = await getRecommendedJobs(ctx.userId, 20);

  console.log(jobs);

  return ctx.json.stringify({
    success: true,
    data: jobs.map(
      ({
        skills,
        matchScore,
        skillMatchScore,
        relativeExperience,
        experienceMatchScore,
        preferencesMatchScore,
        ...job
      }) => job
    ),
  });
});

export const jobs = new Elysia({ name: "Jobs Route", prefix: "/jobs" })
  .use(recruiter)
  .use(user);
