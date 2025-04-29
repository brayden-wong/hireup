import { count, eq, and, ne, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { AuthMiddleware } from "~/middleware";
import { db } from "~/packages/db";
import { messages, messageThreads } from "~/packages/db/schema";
import { uppercaseFirstLetter } from "~/utils/uppercase";

export const archived = new Elysia({
  name: "Archived Threads",
  prefix: "/archived/threads",
})
  .use(db)
  .use(AuthMiddleware);

archived.get("/", async (ctx) => {
  try {
    const threads = await ctx.drizzle.db.transaction(async (tx) => {
      const threads = await tx.query.archivedThreads.findMany({
        columns: {},
        with: {
          thread: {
            columns: { id: true, slug: true, lastActive: true },
            with: {
              creator: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              user: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              messages: {
                limit: 1,
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
              threads.map((t) => t.thread.id)
            )
          )
        );

      const formattedThreads = threads.map(({ thread }) => {
        const unreadCount = unreadMessages.find(
          (um) => um.threadId === thread.id
        );

        const user = {
          ...thread.user,
          firstName: uppercaseFirstLetter(thread.user.firstName),
          lastName: uppercaseFirstLetter(thread.user.lastName),
        };

        const creator = {
          ...thread.creator,
          firstName: uppercaseFirstLetter(thread.creator.firstName),
          lastName: uppercaseFirstLetter(thread.creator.lastName),
        };

        return {
          id: thread.slug,
          user,
          creator,
          lastActive: thread.lastActive,
          unread: (unreadCount?.unread ?? 0) > 0,
          messages: thread.messages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        };
      });

      return { success: true, data: formattedThreads };
    });

    return threads;
  } catch (error) {
    console.error(error);

    return { success: false, error: "Failed to fetch archived threads" };
  }
});

archived.routes.forEach((route) => console.info(route.method, route.path));

console.log();
