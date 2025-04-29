import {
  CONVERSATION_NOT_FOUND,
  PERMISSION_NOT_FOUND,
} from "@hireup/common/error";
import { and, count, eq, ne } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { MESSAGE_LIMIT } from "~/constants/message-limit";
import { AuthMiddleware } from "~/middleware";
import { db, schema } from "~/packages/db";
import { participants } from "~/packages/db/schema";
import {
  formatConversationWithoutRead,
  formatConversationWithRead,
  getUnreadMessages,
} from "./utils";

const Model = new Elysia({ name: "Conversation Route Model" }).model({
  id: t.Object({
    conversationId: t.String({ pattern: "^[0-9]+$" }),
  }),
  slug: t.Object({
    conversationId: t.String(),
  }),
  page: t.Object({
    page: t.String({ pattern: "^[0-9]+$" }),
  }),
});

export const conversation = new Elysia({
  name: "Conversation Route",
  prefix: "/:conversationId",
})
  .use(db)
  .use(Model)
  .use(AuthMiddleware);

conversation.get(
  "/",
  async (ctx) => {
    const conversation = await ctx.db.query.conversations.findFirst({
      where: (conversations, { eq, and, exists }) =>
        and(
          eq(conversations.slug, ctx.params.conversationId),
          exists(
            ctx.db
              .select()
              .from(schema.participants)
              .where(
                and(
                  eq(schema.participants.userId, ctx.userId),
                  eq(schema.participants.conversationId, conversations.id)
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
          limit: MESSAGE_LIMIT,
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

    const messages = await ctx.db
      .select({ count: count(schema.messages) })
      .from(schema.messages)
      .leftJoin(
        schema.conversations,
        eq(schema.conversations.slug, ctx.params.conversationId)
      )
      .where(eq(schema.messages.conversationId, schema.conversations.id));

    if (!conversation)
      throw ctx.error("Not Found", {
        success: false,
        error: CONVERSATION_NOT_FOUND,
      });

    return ctx.json.stringify({
      success: true,
      data: {
        next: messages[0].count > MESSAGE_LIMIT ? 1 : null,
        conversation: formatConversationWithoutRead({
          userId: ctx.userId,
          conversation,
        }),
      },
    });
  },
  { params: "slug" }
);

conversation.get(
  "/messages",
  async (ctx) => {
    const page = +ctx.query.page;
    const conversationId = ctx.params.conversationId;

    const result = await ctx.db.transaction(async (tx) => {
      const conversation = await tx.query.conversations.findFirst({
        columns: { id: true },
        where: (conversations, { eq }) =>
          eq(conversations.slug, conversationId),
      });

      if (!conversation) throw ctx.error("Not Found", CONVERSATION_NOT_FOUND);

      const [total] = await tx
        .select({ count: count() })
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversation.id));

      const messages = await tx.query.messages.findMany({
        limit: MESSAGE_LIMIT,
        offset: page * MESSAGE_LIMIT + 1,
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
      });

      return {
        messages,
        count: total.count,
      };
    });

    return ctx.json.stringify({
      success: true,
      data: {
        messages: result.messages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        ),
        next: result.count > (+page + 1) * MESSAGE_LIMIT ? +page + 1 : null,
      },
    });
  },
  { params: "slug", query: "page" }
);

conversation.post(
  "/read",
  async (ctx) => {
    const conversationId = ctx.params.conversationId;

    const result = await ctx.db.transaction(async (tx) => {
      const conversation = await tx.query.conversations.findFirst({
        columns: { id: true },
        where: (conversations, { eq }) =>
          eq(conversations.slug, conversationId),
      });

      if (!conversation)
        throw ctx.error("Not Found", {
          success: false,
          error: CONVERSATION_NOT_FOUND,
        });

      await tx
        .update(schema.messages)
        .set({ read: true })
        .where(
          and(
            eq(schema.messages.conversationId, conversation.id),
            ne(schema.messages.senderId, ctx.userId)
          )
        );

      return { success: true };
    });

    return ctx.json.stringify({ success: result.success, data: "none" });

    // const conversation = await ctx.db
    //   .select({ unread: count(schema.messages.read) })
    //   .from(schema.messages)
    //   .leftJoin(
    //     schema.conversations,
    //     and(
    //       eq(schema.messages.conversationId, schema.conversations.id),
    //       eq(schema.conversations.slug, conversationId)
    //     )
    //   )
    //   .orderBy(schema.conversations.lastActive)
    //   .where(
    //     and(
    //       eq(schema.messages.read, false),
    //       ne(schema.messages.senderId, ctx.userId)
    //     )
    //   )
    //   .groupBy(schema.conversations.id);

    // return conversation;
  },
  { params: "slug" }
);

conversation.post(
  "/archive",
  async (ctx) => {
    const conversationId = +ctx.params.conversationId;

    try {
      await ctx.db.transaction(async (tx) => {
        const participant = await tx.query.participants.findFirst({
          where: (participants, { eq, and }) =>
            and(
              eq(participants.userId, ctx.userId),
              eq(participants.conversationId, conversationId)
            ),
        });

        if (!participant)
          throw ctx.error("Not Found", {
            success: false,
            error: PERMISSION_NOT_FOUND,
          });

        await tx
          .update(schema.participants)
          .set({ archived: true })
          .where(
            and(
              eq(participants.userId, ctx.userId),
              eq(participants.conversationId, conversationId)
            )
          );
      });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) throw error;

      throw error;
    }

    return ctx.json.stringify({ success: true, data: "Conversation archived" });
  },
  { params: "id" }
);

conversation.post(
  "/unarchive",
  async (ctx) => {
    const conversationId = +ctx.params.conversationId;

    try {
      const conversation = await ctx.db.transaction(async (tx) => {
        const participant = await tx.query.participants.findFirst({
          where: (participants, { eq, and }) =>
            and(
              eq(participants.userId, ctx.userId),
              eq(participants.conversationId, conversationId)
            ),
        });

        if (!participant)
          throw ctx.error("Not Found", {
            success: false,
            error: PERMISSION_NOT_FOUND,
          });

        await tx
          .update(schema.participants)
          .set({ archived: false })
          .where(
            and(
              eq(participants.userId, ctx.userId),
              eq(participants.conversationId, conversationId)
            )
          );

        const conversation = await tx.query.conversations.findFirst({
          where: (conversation, { eq, and, exists }) =>
            and(
              eq(conversation.id, conversationId),
              exists(
                tx
                  .select()
                  .from(schema.participants)
                  .where(
                    and(
                      eq(schema.participants.userId, ctx.userId),
                      eq(schema.participants.conversationId, conversationId)
                    )
                  )
              )
            ),
          with: {
            participants: {
              columns: {
                userId: true,
                permission: true,
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
            messages: {
              limit: MESSAGE_LIMIT,
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

        const unreadMessages = await getUnreadMessages(tx, ctx.userId, [
          conversationId,
        ]);

        if (!conversation) throw ctx.error("Not Found", CONVERSATION_NOT_FOUND);

        return formatConversationWithRead({
          conversation,
          userId: ctx.userId,
          messages: unreadMessages,
        });
      });

      return ctx.json.stringify({ success: true, data: conversation });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) throw error;

      throw error;
    }
  },
  { params: "id" }
);
