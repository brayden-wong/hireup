import { z, ZodType } from "zod";

type EnvParams<T> = {
  schema: ZodType<T>;
  data: unknown;
};

async function createEnv<T>({
  schema,
  data,
}: EnvParams<T>): Promise<T & { validate: () => void }> {
  try {
    return {
      ...(await schema.parseAsync(data)),
      validate: () => schema.parse(data),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError")
      throw new Error(`Validation failed: ${error.message}`);
    else throw error;
  }
}

const schema = z.object({
  PORT: z.number(),
  CLIENT: z.literal("https://hireup.app"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});

export const env = await createEnv({
  schema,
  data: {
    PORT: parseInt(process.env.PORT ?? "8080"),
    CLIENT: process.env.CLIENT,
    REDIS_URL: process.env.REDIS_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
});
