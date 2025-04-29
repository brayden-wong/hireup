import { and, count, eq, inArray, ne, or, sql } from "drizzle-orm";
import { messages, messageThreads } from "~/packages/db/schema";
import { AuthMiddleware } from "../../middleware";
import { db } from "~/packages/db";
import { Elysia, t } from "elysia";

const MESSAGE_LIMIT = 35;

const threads = new Elysia({
  name: "Thread Route",
  prefix: "/threads",
})
  .use(db)
  .use(AuthMiddleware);

threads.get("/", async (ctx) => {
  const threads = await ctx.drizzle.db.transaction(async (tx) => {
    const threads = await tx.query.messageThreads.findMany({
      limit: 10,
      where: (threads, { or, eq }) =>
        or(eq(threads.userId, ctx.userId), eq(threads.creatorId, ctx.userId)),
      columns: { id: true, slug: true, createdAt: true },
      with: {
        creator: {
          columns: { slug: true, firstName: true, lastName: true },
        },
        user: {
          columns: { slug: true, firstName: true, lastName: true },
        },
        messages: {
          limit: MESSAGE_LIMIT,
          orderBy: (messages, { desc }) => [desc(messages.createdAt)],
          columns: {
            id: true,
            content: true,
            createdAt: true,
            deleted: true,
            read: true,
          },
          with: {
            sender: {
              columns: { slug: true, firstName: true, lastName: true },
            },
            reply: {
              columns: {
                id: true,
                content: true,
                createdAt: true,
                deleted: true,
              },
            },
          },
        },
      },
    });

    const unreadMessages = await tx
      .select({
        threadId: messageThreads.id,
        unread: count(messages.read),
      })
      .from(messages)
      .leftJoin(messageThreads, eq(messages.threadId, messageThreads.id))
      .groupBy(messageThreads.id)
      .where(
        and(
          eq(messages.read, false),
          ne(messages.senderId, ctx.userId),
          inArray(
            messages.threadId,
            threads.map((t) => t.id)
          )
        )
      );

    const formattedThreads = threads
      .map((thread) => {
        const unreadCount = unreadMessages.find(
          (um) => um.threadId === thread.id
        );

        const user =
          thread.creator.slug === ctx.slug ? thread.user : thread.creator;

        return {
          id: thread.slug,
          user,
          createdAt: thread.createdAt,
          unread: (unreadCount?.unread ?? 0) > 0,
          messages: thread.messages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        };
      })
      .sort(
        (a, b) =>
          new Date(a.messages[0]!.createdAt).getTime() -
          new Date(b.messages[0]!.createdAt).getTime()
      );

    return formattedThreads;
  });

  return { success: true, data: threads };
});

threads.get(
  "/scroll",
  async (ctx) => {
    const { pageParam = 0 } = ctx.query;

    const result = await ctx.drizzle.db.transaction(async (tx) => {
      const [total] = await tx
        .select({ count: count() })
        .from(messageThreads)
        .where(
          or(
            eq(messageThreads.creatorId, ctx.userId),
            eq(messageThreads.userId, ctx.userId)
          )
        );

      const threads = await tx.query.messageThreads.findMany({
        columns: { slug: true, createdAt: true },
        where: (threads, { eq, or }) =>
          or(eq(threads.creatorId, ctx.userId), eq(threads.userId, ctx.userId)),
        with: {
          creator: {
            columns: { slug: true, firstName: true, lastName: true },
          },
          user: {
            columns: { slug: true, firstName: true, lastName: true },
          },
          messages: {
            limit: MESSAGE_LIMIT,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              content: true,
              createdAt: true,
              replyId: true,
              deleted: true,
              read: true,
            },
            with: {
              sender: {
                columns: { slug: true },
              },
            },
          },
        },
        limit: MESSAGE_LIMIT,
        offset: pageParam * MESSAGE_LIMIT,
      });

      return { threads, count: total.count };
    });

    const formattedThreads = result.threads
      .map((thread) => {
        const user =
          thread.creator.slug === ctx.slug ? thread.user : thread.creator;

        return {
          user,
          slug: thread.slug,
          messages: thread.messages,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.messages[0].createdAt).getTime() -
          new Date(a.messages[0].createdAt).getTime()
      );

    return {
      success: true,
      data: {
        threads: formattedThreads,
        next:
          result.count > (pageParam + 1) * MESSAGE_LIMIT
            ? pageParam + 1
            : undefined,
      },
    };
  },
  {
    query: t.Object({
      pageParam: t.Number(),
    }),
  }
);

threads.post(
  "/find-users",
  async (ctx) => {
    const { name } = ctx.body;

    const users = await ctx.drizzle.db.query.UserSchema.findMany({
      where: (users, { ne, or, and, ilike }) =>
        and(
          or(
            ilike(users.lastName, `%${name}%`),
            ilike(users.firstName, `%${name}%`),
            ilike(
              sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
              `%${name}%`
            )
          ),
          ne(users.id, ctx.userId)
        ),
      columns: {
        slug: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.slug,
        name: `${user.firstName} ${user.lastName}`,
      })),
    };
  },
  {
    body: t.Object({ name: t.String() }),
  }
);

threads.get("/messages/unread", async (ctx) => {
  const [unread] = await ctx.drizzle.db
    .select({ count: count() })
    .from(messages)
    .where(and(ne(messages.senderId, ctx.userId), eq(messages.read, false)));

  return { success: true, data: unread.count ?? 0 };
});

threads.group("/:threadId/messages", (app) =>
  app
    .get(
      "/scroll",
      async (ctx) => {
        const { threadId } = ctx.params;
        const { pageParam = 1 } = ctx.query;

        const result = await ctx.drizzle.db.transaction(async (tx) => {
          const thread = await tx.query.messageThreads.findFirst({
            where: (threads, { eq, or, and }) =>
              and(
                eq(threads.slug, threadId),
                or(
                  eq(threads.creatorId, ctx.userId),
                  eq(threads.userId, ctx.userId)
                )
              ),
          });

          if (!thread)
            throw ctx.error("Not Found", {
              success: false,
              error: "Thread not found",
            });

          const [total] = await tx
            .select({ count: count() })
            .from(messages)
            .where(eq(messages.threadId, thread.id));

          const threadMessages = await tx.query.messages.findMany({
            where: (messages) => eq(messages.threadId, thread.id),
            limit: MESSAGE_LIMIT,
            offset: pageParam * MESSAGE_LIMIT,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              content: true,
              createdAt: true,
              deleted: true,
              read: true,
            },
            with: {
              sender: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              reply: {
                columns: {
                  id: true,
                  content: true,
                  createdAt: true,
                  deleted: true,
                },
              },
            },
          });

          return {
            messages: threadMessages,
            count: total.count,
          };
        });

        return {
          success: true,
          data: {
            messages: result.messages.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            ),
            next:
              result.count > (pageParam + 1) * MESSAGE_LIMIT
                ? pageParam + 1
                : undefined,
          },
        };
      },
      {
        query: t.Object({
          pageParam: t.Number(),
        }),
        params: t.Object({
          threadId: t.String(),
        }),
      }
    )
    .delete(
      "/:messageId",
      async (ctx) => {
        const { threadId, messageId } = ctx.params;

        const result = await ctx.drizzle.db.transaction(async (tx) => {
          const thread = await tx.query.messageThreads.findFirst({
            where: (threads, { eq, or, and }) =>
              and(
                eq(threads.slug, threadId),
                or(
                  eq(threads.creatorId, ctx.userId),
                  eq(threads.userId, ctx.userId)
                )
              ),
          });

          if (!thread)
            throw ctx.error("Not Found", {
              success: false,
              error: "Thread not found",
            });

          const message = await tx.query.messages.findFirst({
            where: (messages, { eq, and }) =>
              and(
                eq(messages.id, messageId),
                eq(messages.threadId, thread.id),
                eq(messages.senderId, ctx.userId)
              ),
          });

          if (!message)
            throw ctx.error("Not Found", {
              success: false,
              error: "Message not found",
            });

          await tx
            .update(messages)
            .set({ deleted: true })
            .where(eq(messages.id, messageId));

          const updatedThread = await tx.query.messageThreads.findFirst({
            columns: { slug: true, createdAt: true },
            where: (thread, { eq, or, and }) =>
              and(
                eq(thread.id, thread.id),
                or(
                  eq(thread.creatorId, ctx.userId),
                  eq(thread.userId, ctx.userId)
                )
              ),
            with: {
              creator: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              user: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              messages: {
                limit: ctx.body.messages,
                orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                columns: {
                  id: true,
                  content: true,
                  createdAt: true,
                  deleted: true,
                  read: true,
                },
                with: {
                  sender: {
                    columns: { slug: true, firstName: true, lastName: true },
                  },
                  reply: {
                    columns: {
                      id: true,
                      content: true,
                      createdAt: true,
                      deleted: true,
                    },
                  },
                },
              },
            },
          });

          if (!updatedThread)
            throw ctx.error("Not Found", {
              success: false,
              error: "Thread not found",
            });

          const { slug: id, ...data } = updatedThread;

          return { success: true, data: { updatedThread: { id, ...data } } };
        });

        return result;
      },
      {
        body: t.Object({
          messages: t.Number(),
        }),
        params: t.Object({
          threadId: t.String(),
          messageId: t.Number(),
        }),
        cookie: t.Object({
          session_id: t.String(),
        }),
      }
    )
);
