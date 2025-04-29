import { and, count, eq, ne, or, exists } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { FETCH_MAX_CONVERSATIONS } from "~/constants/conversation-limit";
import { INTERNAL_SERVER_ERROR } from "~/constants/errors";
import { AuthMiddleware } from "~/middleware";
import { db, schema } from "~/packages/db";
import { json } from "~/packages/json";
import { conversation } from "./conversation";
import { formatConversationWithRead, getUnreadMessages } from "./utils";
import { messages } from "./messages";

export const conversations = new Elysia({
  name: "Conversations Route",
  prefix: "/conversations",
})
  .use(db)
  .use(json)
  .use(AuthMiddleware);

conversations.get("/", async (ctx) => {
  try {
    const conversations = await ctx.db.transaction(async (tx) => {
      const conversations = await tx.query.conversations.findMany({
        limit: FETCH_MAX_CONVERSATIONS,
        columns: { id: true, slug: true, lastActive: true },
        orderBy: (conversations, { desc }) => [desc(conversations.lastActive)],
        where: (conversations, { eq, or, and, exists }) =>
          and(
            eq(conversations.archived, false),
            or(
              eq(conversations.creatorId, ctx.userId),
              exists(
                ctx.db
                  .select()
                  .from(schema.participants)
                  .where(
                    and(
                      eq(schema.participants.archived, false),
                      eq(schema.participants.userId, ctx.userId),
                      eq(schema.participants.conversationId, conversations.id)
                    )
                  )
                  .groupBy(
                    schema.participants.conversationId,
                    schema.participants.userId
                  )
              )
            )
          ),
        with: {
          participants: {
            columns: { userId: true, permission: true },
            with: {
              user: {
                columns: { slug: true, firstName: true, lastName: true },
              },
            },
          },
          messages: {
            limit: 1,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              read: true,
              content: true,
              deleted: true,
              createdAt: true,
            },
            with: {
              sender: {
                columns: {
                  id: true,
                  slug: true,
                  firstName: true,
                  lastName: true,
                },
              },
              reply: {
                columns: {
                  id: true,
                  content: true,
                  deleted: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      const unreadMessages = await getUnreadMessages(
        tx,
        ctx.userId,
        conversations.map((c) => c.id)
      );

      console.log(unreadMessages);

      const filteredConversations = conversations.map((conversation) =>
        formatConversationWithRead({
          userId: ctx.userId,
          conversation,
          messages: unreadMessages,
        })
      );

      return filteredConversations;
    });

    return ctx.json.stringify({ success: true, data: conversations });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) throw error;

    throw ctx.error(
      "Internal Server Error",
      ctx.json.stringify({ success: false, error: INTERNAL_SERVER_ERROR })
    );
  }
});

conversations.get(
  "/infinite-list",
  async (ctx) => {
    const { page = 0 } = ctx.query;

    await ctx.db.transaction(async (tx) => {
      const sq = exists(
        tx
          .select()
          .from(schema.participants)
          .where(
            and(
              eq(schema.participants.userId, ctx.userId),
              ne(schema.participants.archived, true)
            )
          )
      );

      const [total] = await tx
        .select({ count: count() })
        .from(schema.conversations)
        .where(or(eq(schema.conversations.creatorId, ctx.userId), sq));

      const conversations = await tx.query.conversations.findMany({
        columns: { id: true, slug: true, lastActive: true },
        where: (conversations, { eq, or }) =>
          or(eq(conversations.creatorId, ctx.userId), sq),
        orderBy: (conversations, { desc }) => [desc(conversations.lastActive)],
        with: {
          participants: {
            columns: { userId: true, permission: true },
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
          messages: {
            limit: 1,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              read: true,
              content: true,
              deleted: true,
              createdAt: true,
            },
            with: {
              sender: {
                columns: {
                  id: true,
                  slug: true,
                  firstName: true,
                  lastName: true,
                },
              },
              reply: {
                columns: {
                  id: true,
                  content: true,
                  deleted: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        offset: page * FETCH_MAX_CONVERSATIONS,
        limit: FETCH_MAX_CONVERSATIONS,
      });

      const unreadMessages = await getUnreadMessages(
        tx,
        ctx.userId,
        conversations.map((c) => c.id)
      );

      const formattedConversations = conversations.map((conversation) =>
        formatConversationWithRead({
          userId: ctx.userId,
          conversation,
          messages: unreadMessages,
        })
      );

      return {
        success: true,
        data: {
          conversations: formattedConversations,
          next:
            total.count > (page + 1) * FETCH_MAX_CONVERSATIONS
              ? page + 1
              : undefined,
        },
      };
    });

    return ctx.json.stringify(conversations);
  },
  { query: t.Object({ page: t.Number() }) }
);

conversations.get(
  "/find-users",
  async function* (ctx) {
    const { name } = ctx.query;

    try {
      const conversations = await ctx.db.query.conversations.findMany({
        limit: FETCH_MAX_CONVERSATIONS,
        columns: { id: true, slug: true, lastActive: true },
        orderBy: (conversations, { desc }) => [desc(conversations.lastActive)],
        where: (conversations, { eq, or, and, sql, ilike, exists }) =>
          and(
            eq(conversations.archived, false),
            exists(
              ctx.db
                .select()
                .from(schema.participants)
                .where(
                  and(
                    eq(schema.participants.archived, false),
                    eq(schema.participants.conversationId, conversations.id),
                    exists(
                      ctx.db
                        .select()
                        .from(schema.users)
                        .where(
                          and(
                            ne(schema.users.id, ctx.userId),
                            eq(schema.users.id, schema.participants.userId),
                            or(
                              ilike(schema.users.lastName, `%${name}%`),
                              ilike(schema.users.firstName, `%${name}%`),
                              ilike(
                                sql`CONCAT(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
                                `%${name}%`
                              )
                            )
                          )
                        )
                    )
                  )
                )
            )
          ),
        with: {
          participants: {
            where: (participants, { eq, ne, and, exists }) =>
              and(
                ne(participants.archived, true),
                exists(
                  ctx.db
                    .select()
                    .from(schema.users)
                    .where(
                      and(
                        eq(schema.users.id, participants.userId),
                        exists(
                          ctx.db
                            .select()
                            .from(schema.conversations)
                            .where(
                              eq(
                                schema.conversations.id,
                                participants.conversationId
                              )
                            )
                        )
                      )
                    )
                )
              ),
            columns: { userId: true, permission: true },
            with: {
              user: {
                columns: { slug: true, firstName: true, lastName: true },
              },
            },
          },
          messages: {
            limit: 1,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              read: true,
              content: true,
              deleted: true,
              createdAt: true,
            },
            with: {
              sender: {
                columns: {
                  id: true,
                  slug: true,
                  firstName: true,
                  lastName: true,
                },
              },
              reply: {
                columns: {
                  id: true,
                  content: true,
                  deleted: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      const unreadMessages = await getUnreadMessages(
        ctx.db,
        ctx.userId,
        conversations.map((c) => c.id)
      );

      const filteredConversations = conversations.map((conversation) =>
        formatConversationWithRead({
          userId: ctx.userId,
          conversation,
          messages: unreadMessages,
        })
      );

      const allConversations = ctx.json.stringify({
        conversations: filteredConversations,
      });

      yield allConversations;

      const noConversations = await ctx.db.query.users.findMany({
        columns: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
        },
        where: (users, { eq, or, and, sql, ilike, inArray, notExists }) =>
          and(
            or(
              ilike(users.firstName, `%${name}%`),
              ilike(users.lastName, `%${name}%`),
              ilike(
                sql`CONCAT(${users.firstName}, ' ', ${schema.users.lastName})`,
                `%${name}%`
              )
            ),
            ne(users.id, ctx.userId),
            notExists(
              ctx.db
                .select()
                .from(schema.participants)
                .where(
                  and(
                    eq(schema.participants.userId, users.id),
                    inArray(
                      schema.participants.conversationId,
                      ctx.db
                        .select({ id: schema.conversations.id })
                        .from(schema.conversations)
                        .where(
                          eq(
                            schema.conversations.id,
                            schema.participants.conversationId
                          )
                        )
                    )
                  )
                )
            )
          ),
      });

      const allUsers = ctx.json.stringify({ noConversations: noConversations });

      yield allUsers;

      const archivedConversations = await ctx.db.query.conversations.findMany({
        where: (conversations, { eq, or, and, sql, ilike, exists }) =>
          exists(
            ctx.db
              .select()
              .from(schema.participants)
              .where(
                and(
                  or(
                    eq(conversations.archived, true),
                    eq(schema.participants.archived, true)
                  ),
                  eq(schema.participants.conversationId, conversations.id),
                  exists(
                    ctx.db
                      .select()
                      .from(schema.users)
                      .where(
                        and(
                          ne(schema.users.id, ctx.userId),
                          eq(schema.users.id, schema.participants.userId),
                          or(
                            ilike(schema.users.lastName, `%${name}%`),
                            ilike(schema.users.firstName, `%${name}%`),
                            ilike(
                              sql`CONCAT(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
                              `%${name}%`
                            )
                          )
                        )
                      )
                  )
                )
              )
          ),
        with: {
          participants: {
            where: (participants, { eq, ne, and, exists }) =>
              and(
                ne(participants.archived, true),
                exists(
                  ctx.db
                    .select()
                    .from(schema.users)
                    .where(
                      and(
                        eq(schema.users.id, participants.userId),
                        exists(
                          ctx.db
                            .select()
                            .from(schema.conversations)
                            .where(
                              eq(
                                schema.conversations.id,
                                participants.conversationId
                              )
                            )
                        )
                      )
                    )
                )
              ),
            columns: { userId: true, permission: true },
            with: {
              user: {
                columns: { slug: true, firstName: true, lastName: true },
              },
            },
          },
          messages: {
            limit: 1,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            columns: {
              id: true,
              read: true,
              content: true,
              deleted: true,
              createdAt: true,
            },
            with: {
              sender: {
                columns: { slug: true, firstName: true, lastName: true },
              },
              reply: {
                columns: {
                  id: true,
                  content: true,
                  deleted: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      const filteredArchivedConversations = archivedConversations.map(
        ({ participants, ...conversation }) => {
          const unread = unreadMessages.find(
            (c) => c.conversationId === conversation.id
          );

          const me = participants.find((p) => p.userId === ctx.userId);
          const participant = participants.find((p) => p.userId !== ctx.userId);

          return {
            permisssion: me?.permission,
            read: (unread?.unread ?? 0) > 0,
            participant,
            ...conversation,
          };
        }
      );

      const allArchivedConversations = ctx.json.stringify({
        archivedConversations: filteredArchivedConversations,
      });

      yield allArchivedConversations;
    } catch (error) {
      console.error("Error in streamResults:", error);
      yield JSON.stringify({ error: "An error occurred" });
    }
  },
  { query: t.Object({ name: t.String() }) }
);

conversations.use(conversation);
conversations.use(messages);
