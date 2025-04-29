import { Elysia, t } from "elysia";
import { db } from "../../packages/db";
import { AuthMiddleware } from "../../middleware";
import { and, count, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  messages,
  messageThreads,
  archivedThreads,
  users,
} from "~/packages/db/schema";
import { thread as route } from "./thread";
import { MESSAGE_LIMIT } from "~/constants/message-limit";
import { FETCH_MAX_CONVERSATIONS } from "~/constants/conversation-limit";
import { alias } from "drizzle-orm/pg-core";
import { uppercaseFirstLetter } from "~/utils/uppercase";

export const threads = new Elysia({
  name: "Thread Route",
  prefix: "/threads",
})
  .use(db)
  .use(AuthMiddleware);

threads.get("/", async (ctx) => {
  const threads = await ctx.drizzle.db.transaction(async (tx) => {
    const threads = await tx.query.messageThreads.findMany({
      limit: FETCH_MAX_CONVERSATIONS,
      where: (threads, { or, eq, notExists, and }) =>
        and(
          or(eq(threads.userId, ctx.userId), eq(threads.creatorId, ctx.userId)),
          notExists(
            tx
              .select()
              .from(archivedThreads)
              .where(
                and(
                  eq(archivedThreads.archived, true),
                  eq(archivedThreads.userId, ctx.userId),
                  eq(archivedThreads.threadId, threads.id)
                )
              )
          )
        ),
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

    const formattedThreads = threads.map((thread) => {
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

    return formattedThreads.sort(
      (a, b) =>
        new Date(b.messages[0]!.createdAt).getTime() -
        new Date(a.messages[0]!.createdAt).getTime()
    );
  });

  return { success: true, data: threads };
});

threads.get(
  "/infinite",
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
          new Date(b.messages[0]!.createdAt).getTime() -
          new Date(a.messages[0]!.createdAt).getTime()
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

    const creator = alias(users, "creator");
    const user = alias(users, "user");

    const result = await ctx.drizzle.db.transaction(async (tx) => {
      const [usersWithoutThread, usersWithThread, usersWithArchivedThreads] =
        await Promise.all([
          tx.query.users.findMany({
            where: (users, { ne, or, and, ilike, notExists }) =>
              and(
                or(
                  ilike(users.lastName, `%${name}%`),
                  ilike(users.firstName, `%${name}%`),
                  ilike(
                    sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
                    `%${name}%`
                  )
                ),
                ne(users.id, ctx.userId),
                notExists(
                  tx
                    .select()
                    .from(messageThreads)
                    .where(
                      or(
                        and(
                          eq(messageThreads.userId, users.id),
                          eq(messageThreads.creatorId, ctx.userId)
                        ),
                        and(
                          eq(messageThreads.userId, ctx.userId),
                          eq(messageThreads.creatorId, users.id)
                        )
                      )
                    )
                )
              ),
            columns: {
              slug: true,
              firstName: true,
              lastName: true,
            },
          }),
          tx.query.users.findMany({
            columns: {
              slug: true,
              firstName: true,
              lastName: true,
            },
            with: {
              creatorThreads: {
                columns: { slug: true, creatorId: true, userId: true },
                with: {
                  messages: {
                    limit: 1,
                    columns: { content: true },
                    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                  },
                },
                where: (threads, { ne, and, notExists }) =>
                  and(
                    ne(threads.creatorId, ctx.userId),
                    notExists(
                      tx
                        .select()
                        .from(archivedThreads)
                        .where(
                          and(
                            eq(archivedThreads.threadId, threads.id),
                            eq(archivedThreads.userId, ctx.userId)
                          )
                        )
                    )
                  ),
              },
              threads: {
                columns: { slug: true, creatorId: true, userId: true },
                with: {
                  messages: {
                    limit: 1,
                    columns: { content: true },
                    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                  },
                },
                where: (threads, { ne, and, notExists }) =>
                  and(
                    ne(threads.userId, ctx.userId),
                    notExists(
                      tx
                        .select()
                        .from(archivedThreads)
                        .where(
                          and(
                            eq(archivedThreads.threadId, threads.id),
                            eq(archivedThreads.userId, ctx.userId)
                          )
                        )
                    )
                  ),
              },
            },
            where: (users, { ne, or, and, ilike, exists, notExists }) =>
              and(
                or(
                  ilike(users.lastName, `%${name}%`),
                  ilike(users.firstName, `%${name}%`),
                  ilike(
                    sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
                    `%${name}%`
                  )
                ),
                ne(users.id, ctx.userId),
                exists(
                  tx
                    .select()
                    .from(messageThreads)
                    .where(
                      or(
                        and(
                          eq(messageThreads.userId, ctx.userId),
                          eq(messageThreads.creatorId, users.id)
                        ),
                        and(
                          eq(messageThreads.creatorId, ctx.userId),
                          eq(messageThreads.userId, users.id)
                        )
                      )
                    )
                ),
                notExists(
                  tx
                    .select()
                    .from(archivedThreads)
                    .where(
                      and(
                        eq(archivedThreads.userId, ctx.userId),
                        exists(
                          tx
                            .select()
                            .from(messageThreads)
                            .where(
                              and(
                                or(
                                  and(
                                    eq(messageThreads.userId, ctx.userId),
                                    eq(messageThreads.creatorId, users.id)
                                  ),
                                  and(
                                    eq(messageThreads.creatorId, ctx.userId),
                                    eq(messageThreads.userId, users.id)
                                  )
                                ),
                                eq(archivedThreads.threadId, messageThreads.id)
                              )
                            )
                        )
                      )
                    )
                )
              ),
          }),
          tx.query.archivedThreads.findMany({
            columns: {},
            with: {
              thread: {
                columns: { slug: true },
                with: {
                  messages: {
                    limit: 1,
                    columns: { content: true },
                    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                  },
                  creator: {
                    columns: {
                      id: true,
                      slug: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
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
            where: (threads, { eq, and, exists }) =>
              and(
                eq(threads.userId, ctx.userId),
                exists(
                  tx
                    .select()
                    .from(messageThreads)
                    .leftJoin(creator, eq(messageThreads.creatorId, creator.id))
                    .leftJoin(user, eq(messageThreads.userId, user.id))
                    .where(
                      and(
                        eq(messageThreads.id, threads.threadId),
                        or(
                          or(
                            ilike(user.lastName, `%${name}%`),
                            ilike(user.firstName, `%${name}%`),
                            ilike(
                              sql`CONCAT(${creator.firstName}, ' ', ${creator.lastName})`,
                              `%${name}%`
                            )
                          ),
                          or(
                            ilike(user.lastName, `%${name}%`),
                            ilike(user.firstName, `%${name}%`),
                            ilike(
                              sql`CONCAT(${user.lastName}, ' ', ${user.lastName})`,
                              `%${name}%`
                            )
                          )
                        )
                      )
                    )
                )
              ),
          }),
          // tx.query.archivedThreads.findMany({
          //   columns: {},
          //   with: {
          //     thread: {
          //       columns: { slug: true },
          //       with: {
          //         messages: {
          //           limit: 1,
          //           columns: { content: true },
          //           orderBy: (messages, { desc }) => [desc(messages.createdAt)],
          //         },
          //         creator: {
          //           columns: {
          //             id: true,
          //             slug: true,
          //             firstName: true,
          //             lastName: true,
          //           },
          //         },
          //         user: {
          //           columns: {
          //             id: true,
          //             slug: true,
          //             firstName: true,
          //             lastName: true,
          //           },
          //         },
          //       },
          //     },
          //   },
          //   where: (threads, { eq, and, exists }) =>
          //     and(
          //       eq(threads.userId, ctx.userId),
          //       exists(
          //         tx
          //           .select()
          //           .from(messageThreads)
          //           .leftJoin(creator, eq(messageThreads.creatorId, creator.id))
          //           .leftJoin(user, eq(messageThreads.userId, user.id))
          //           .where(
          //             and(
          //               eq(messageThreads.id, threads.threadId),
          //               or(
          //                 or(
          //                   ilike(user.lastName, `%${name}%`),
          //                   ilike(user.firstName, `%${name}%`),
          //                   ilike(
          //                     sql`CONCAT(${creator.firstName}, ' ', ${creator.lastName})`,
          //                     `%${name}%`
          //                   )
          //                 ),
          //                 or(
          //                   ilike(user.lastName, `%${name}%`),
          //                   ilike(user.firstName, `%${name}%`),
          //                   ilike(
          //                     sql`CONCAT(${user.lastName}, ' ', ${user.lastName})`,
          //                     `%${name}%`
          //                   )
          //                 )
          //               )
          //             )
          //           )
          //       )
          //     ),
          // }),
        ]);

      console.log(JSON.stringify(usersWithoutThread, null, 2));

      return {
        withoutThread: usersWithoutThread.map((user) => ({
          id: user.slug,
          name: `${uppercaseFirstLetter(user.firstName)} ${uppercaseFirstLetter(
            user.lastName
          )}`,
        })),
        withThread: usersWithThread.map((user) => {
          const message = user.creatorThreads.concat(user.threads)[0]!
            .messages[0]!;

          return {
            id: user.slug,
            content: message.content,
            name: `${uppercaseFirstLetter(
              user.firstName
            )} ${uppercaseFirstLetter(user.lastName)}`,
            thread: user.creatorThreads
              .concat(user.threads)
              .filter(
                (thread) =>
                  thread.creatorId === ctx.userId ||
                  thread.userId === ctx.userId
              )[0]!.slug,
          };
        }),
        archivedThreads: usersWithArchivedThreads.map(({ thread }) => {
          const user =
            thread.creator.id === ctx.userId ? thread.user : thread.creator;

          const message = thread.messages[0]!;

          return {
            id: user.slug,
            thread: thread.slug,
            content: message.content,
            name: `${uppercaseFirstLetter(
              user.firstName
            )} ${uppercaseFirstLetter(user.lastName)}`,
          };
        }),
      };
    });

    return { success: true, data: result };
  },
  {
    body: t.Object({ name: t.String() }),
  }
);

threads.use(route);

threads.routes.forEach((route) => console.info(route.method, route.path));

console.log();
