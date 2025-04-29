import { Elysia, t } from "elysia";
import { db } from "~/packages/db";
import {
  messages,
  messages as messagesSchema,
  archivedThreads,
  messageThreads,
} from "~/packages/db/schema";
import { AuthMiddleware } from "~/middleware";
import { MESSAGE_LIMIT } from "~/constants/message-limit";
import { and, count, eq, ne } from "drizzle-orm";

export const thread = new Elysia({
  name: "messages",
  prefix: "/:threadId",
})
  .use(db)
  .use(AuthMiddleware);

thread.get("/", async (ctx) => {
  const thread = await ctx.drizzle.db.query.messageThreads.findFirst({
    where: (threads, { eq, or, and }) =>
      and(
        eq(threads.slug, ctx.params.threadId),
        or(eq(threads.creatorId, ctx.userId), eq(threads.userId, ctx.userId))
      ),
    columns: { slug: true, createdAt: true },
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
      archivedThreads: {
        columns: {
          archived: true,
        },
      },
    },
  });

  if (!thread)
    return {
      success: false,
      error: "Thread not found",
    };

  return {
    success: true,
    data: {
      id: thread.slug,
      user: thread.user,
      creator: thread.creator,
      createdAt: thread.createdAt,
      archived: thread.archivedThreads?.archived ?? false,
      messages: thread.messages.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      ),
    },
  };
});

thread.post("/archive", async (ctx) => {
  const { threadId } = ctx.params;

  const result = await ctx.drizzle.db.transaction(async (tx) => {
    const thread = await tx.query.messageThreads.findFirst({
      columns: { id: true },
      where: (threads, { eq, or, and }) =>
        and(
          eq(threads.slug, threadId),
          or(eq(threads.creatorId, ctx.userId), eq(threads.userId, ctx.userId))
        ),
    });

    if (!thread)
      throw ctx.error("Not Found", {
        success: false,
        error: "Thread not found",
      });

    await tx.insert(archivedThreads).values({
      userId: ctx.userId,
      threadId: thread.id,
    });

    return { success: true, data: { archived: threadId } } as const;
  });

  return result;
});

thread.delete("/unarchive", async (ctx) => {
  const { threadId } = ctx.params;

  const result = await ctx.drizzle.db.transaction(async (tx) => {
    const thread = await tx.query.messageThreads.findFirst({
      columns: { id: true, slug: true, lastActive: true },
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
      where: (threads, { eq, or, and }) =>
        and(
          eq(threads.slug, threadId),
          or(eq(threads.creatorId, ctx.userId), eq(threads.userId, ctx.userId))
        ),
    });

    if (!thread)
      throw ctx.error("Not Found", {
        success: false,
        error: "Thread not found",
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
          eq(messageThreads.id, thread.id),
          ne(messages.senderId, ctx.userId)
        )
      );

    await tx
      .delete(archivedThreads)
      .where(
        and(
          eq(archivedThreads.userId, ctx.userId),
          eq(archivedThreads.threadId, thread.id)
        )
      );

    return {
      success: true,
      data: {
        unarchived: {
          ...thread,
          unread: unreadMessages.length > 0,
          id: thread.slug,
        },
      },
    } as const;
  });

  return result;
});

thread.get(
  "/infinite",
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
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
);

thread.delete(
  "/messages/:messageId",
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
            or(eq(thread.creatorId, ctx.userId), eq(thread.userId, ctx.userId))
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
    body: t.Object({ messages: t.Number() }),
    params: t.Object({ threadId: t.String(), messageId: t.Number() }),
  }
);

thread.get(
  "/messages",
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
        .from(messagesSchema)
        .where(eq(messagesSchema.threadId, thread.id));

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
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
  }
);

thread.routes.forEach((route) => console.info(route.method, route.path));

console.log();
