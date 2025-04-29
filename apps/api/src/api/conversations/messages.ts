import { SENT_MESSAGE } from "@hireup/common/constants";
import { CONVERSATION_NOT_FOUND } from "@hireup/common/error";

import { Elysia, t } from "elysia";

import { AuthMiddleware } from "~/middleware";
import { broker } from "~/packages/broker";
import { db, schema } from "~/packages/db";

const _model = new Elysia({ name: "Message Model" }).model({
  string: t.Object({ conversationId: t.String() }),
  number: t.Object({ conversationId: t.String({ pattern: "^[0-9]+$" }) }),
  post: t.Object({
    userId: t.Number(),
    content: t.String(),
    replyId: t.Nullable(t.Number()),
  }),
});

export const messages = new Elysia({
  name: "Message Route",
  prefix: "/:conversationId/messages",
})
  .use(db)
  .use(_model)
  .use(broker)
  .use(AuthMiddleware);

messages.post(
  "/",
  async (ctx) => {
    const conversationId = +ctx.params.conversationId;

    const message = await ctx.db.transaction(async (tx) => {
      const conversation = await tx.query.conversations.findFirst({
        columns: { id: true, slug: true },
        where: (conversations, { eq }) => eq(conversations.id, conversationId),
        with: {
          participants: {
            with: { user: { columns: { slug: true } } },
            where: (participant, { ne }) => ne(participant.userId, ctx.userId),
          },
        },
      });

      if (!conversation)
        throw ctx.error("Not Found", {
          success: false,
          error: CONVERSATION_NOT_FOUND,
        });

      const { userId, ...body } = ctx.body;

      const [{ id }] = await tx
        .insert(schema.messages)
        .values({
          ...body,
          conversationId,
          senderId: ctx.userId,
        })
        .returning({ id: schema.messages.id });

      const message = await tx.query.messages.findFirst({
        where: (messages, { and, eq }) =>
          and(
            eq(messages.id, id),
            eq(messages.senderId, ctx.userId),
            eq(messages.conversationId, conversationId)
          ),
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

      if (!message) throw ctx.error("Not Found", CONVERSATION_NOT_FOUND);

      ctx.broker.publish(conversation.participants[0].user.slug, {
        type: SENT_MESSAGE,
        data: {
          ...message,
          conversationId: conversation.slug,
        },
      });

      return message;
    });

    return ctx.json.stringify({ success: true, data: message });
  },
  { body: "post", params: "number" }
);
