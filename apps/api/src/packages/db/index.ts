import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { Elysia } from "elysia";
import { sessions } from "./schema";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import type { AccountType } from "@hireup/common/constants";

const conn = postgres(env.DATABASE_URL);

const ACTIVITY_UPDATE_THRESHOLD = 1000 * 60 * 60 * 24;

export type Session = {
  id: string;
  slug: string;
  userId: number;
  account: AccountType;
};

export const database = drizzle(conn, { schema });

export const db = new Elysia({ name: "Database" }).decorate("db", database);

export const dbFunctions = new Elysia({ name: "Database functions" }).decorate(
  "db_functions",
  {
    getSession: async (id: string): Promise<Session | null> => {
      const session = await database.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, id),
        with: {
          user: {
            columns: {
              id: true,
              slug: true,
              account: true,
            },
          },
        },
      });

      if (!session) return null;

      if (Date.now() - session.lastActive.getTime() < ACTIVITY_UPDATE_THRESHOLD)
        return {
          id: session.id,
          userId: session.user.id,
          slug: session.user.slug,
          account: session.user.account,
        };

      await database
        .update(sessions)
        .set({ lastActive: new Date() })
        .where(eq(sessions.id, session.id));

      return {
        id: session.id,
        userId: session.user.id,
        slug: session.user.slug,
        account: session.user.account,
      };
    },
  }
);

export { schema };
