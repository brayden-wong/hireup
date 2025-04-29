import { messages, messageThreads } from "../packages/db/schema";
import Elysia, { t } from "elysia";
import { database, db, Session } from "~/packages/db";
import { PostHog } from "posthog-node";
import { env } from "bun";
import { and, eq, ne } from "drizzle-orm";

const CreateThreadSchema = t.Object({
  type: t.Literal("create_thread"),
  data: t.Object({ userId: t.String(), content: t.String() }),
});

const ReadThreadSchema = t.Object({
  type: t.Literal("read_thread"),
  data: t.Object({
    threadId: t.String(),
  }),
});

const MessageSchema = t.Object({
  type: t.Literal("message"),
  data: t.Object({
    slug: t.String(),
    content: t.String(),
    replyId: t.Nullable(t.Number()),
  }),
});

const WebsocketMessageSchema = t.Union([
  MessageSchema,
  ReadThreadSchema,
  CreateThreadSchema,
]);

export const websocket = new Elysia({ name: "websocket" })
  .use(db)
  .ws("/threads/ws", {
    open: async (ws) => {
      const sessionId = ws.data.query.sessionId;

      const session = await ws.data.drizzle.getSession(sessionId);

      if (!session) {
        const client = new PostHog(env.POSTHOG_SECRET, {
          host: env.POSTHOG_HOST,
        });

        console.error(`session ${sessionId} not found`);

        client.capture({ distinctId: sessionId, event: "session not found" });

        ws.send({ success: false, error: "session not found" });
        return void ws.close();
      }

      ws.subscribe(session.slug);

      console.log(session.slug, "subscribed");

      ws.send({ success: true, data: { type: "subscribed" } });
    },
    message: async (ws, message) => {
      const session = await ws.data.drizzle.getSession(ws.data.query.sessionId);

      if (!session) return ws.terminate();

      if (message.type === "create_thread") {
        const result = await handleCreateThread({
          session,
          data: message.data,
          db: ws.data.drizzle.db,
        });

        if (result instanceof Error)
          return void ws.send({ success: false, error: result.message });

        ws.publish(result.publish.to, result.publish.data);

        return void ws.send(result.send);
      }

      if (message.type === "read_thread") {
        const error = await handleReadThread({
          session,
          data: message.data,
          db: ws.data.drizzle.db,
        });

        if (!error) return;

        console.error(error.message);

        return void ws.send({ success: false, error: error.message });
      }

      if (message.type === "message") {
        const result = await handleWriteMessage({
          session,
          data: message.data,
          db: ws.data.drizzle.db,
        });

        if (result instanceof Error)
          return void ws.send({ success: false, error: result.message });

        ws.publish(result.publish.to, result.publish.data);

        return void ws.send(result.send);
      }
    },
    body: WebsocketMessageSchema,
    query: t.Object({
      sessionId: t.String(),
    }),
  });

type GenericProps<T> = {
  session: Session;
  db: typeof database;
  data: T;
};

type CreateThreadProps = GenericProps<{
  userId: string;
  content: string;
}>;

type ReadThreadProps = GenericProps<{
  threadId: string;
}>;

type MessageProps = GenericProps<{
  slug: string;
  content: string;
  replyId: number | null;
}>;

async function handleCreateThread({ db, data, session }: CreateThreadProps) {
  const { userId, content } = data;

  try {
    const result = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: (users, { eq }) => eq(users.slug, userId),
        columns: {
          id: true,
          slug: true,
          lastName: true,
          firstName: true,
        },
      });

      if (!user) throw new Error("User not found");

      const [thread] = await tx
        .insert(messageThreads)
        .values({
          userId: user.id,
          creatorId: session.userId,
        })
        .returning({
          id: messageThreads.id,
          slug: messageThreads.slug,
          createdAt: messageThreads.createdAt,
        });

      const [message] = await tx
        .insert(messages)
        .values({
          content,
          threadId: thread.id,
          senderId: session.userId,
        })
        .returning({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          replyId: messages.replyId,
          deleted: messages.deleted,
          read: messages.read,
        });

      const creator = await tx.query.users.findFirst({
        columns: { slug: true, firstName: true, lastName: true },
        where: (users, { eq }) => eq(users.id, session.userId),
      });

      if (!creator) throw new Error("Creator cannot be found");

      const publish = {
        to: user.slug,
        data: {
          success: true,
          data: {
            type: "receive_message",
            thread: {
              id: thread.slug,
              user: creator,
              createdAt: thread.createdAt,
              message: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                replyId: message.replyId,
                deleted: message.deleted,
                read: message.read,
                sender: {
                  slug: session.slug,
                },
              },
            },
          },
        },
      };

      const send = {
        success: true,
        data: {
          type: "created_thread",
          thread: {
            id: thread.slug,
            user: creator,
            createdAt: thread.createdAt,
            messages: [
              {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                replyId: message.replyId,
                deleted: message.deleted,
                read: message.read,
                sender: {
                  slug: session.slug,
                },
              },
            ],
          },
        },
      };

      return { send, publish };
    });

    return result;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return error;
    }

    return new Error("Unknown error occurred");
  }
}

async function handleReadThread({ db, data, session }: ReadThreadProps) {
  const { threadId } = data;

  try {
    await db.transaction(async (tx) => {
      const thread = await tx.query.messageThreads.findFirst({
        columns: { id: true },
        where: (threads, { eq }) => eq(threads.slug, threadId),
      });

      if (!thread) throw new Error("Thread not found");

      await tx
        .update(messages)
        .set({ read: true })
        .where(
          and(
            eq(messages.threadId, thread.id),
            ne(messages.senderId, session.userId)
          )
        );
    });
  } catch (error) {
    if (error instanceof Error) return error;
  }
}

async function handleWriteMessage({ db, data, session }: MessageProps) {
  try {
    const result = await db.transaction(async (tx) => {
      const today = new Date();

      const thread = await tx.query.messageThreads.findFirst({
        where: (threads, { eq }) => eq(threads.slug, data.slug),
        with: {
          user: {
            columns: { slug: true, firstName: true, lastName: true },
          },
          creator: {
            columns: { slug: true, firstName: true, lastName: true },
          },
        },
      });

      if (!thread) throw new Error("Thread not found");

      const [message] = await tx
        .insert(messages)
        .values({
          ...data,
          threadId: thread.id,
          senderId: session.userId,
        })
        .returning({
          id: messages.id,
        });

      const messageWithReply = await tx.query.messages.findFirst({
        where: (messages, { eq }) => eq(messages.id, message.id),
        columns: {
          id: true,
          content: true,
          createdAt: true,
          deleted: true,
          read: true,
        },
        with: {
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

      if (today.getDate() > thread.lastActive.getDate())
        await tx
          .update(messageThreads)
          .set({ lastActive: today })
          .where(eq(messageThreads.id, thread.id));

      if (!messageWithReply) throw new Error("Message not found");

      const publish = {
        to:
          thread.user.slug === session.slug
            ? thread.creator.slug
            : thread.user.slug,
        data: {
          success: true,
          data: {
            type: "receive_message",
            thread: {
              id: thread.slug,
              user: thread.user,
              creator: thread.creator,
              createdAt: thread.createdAt,
              message: {
                id: messageWithReply.id,
                read: messageWithReply.read,
                reply: messageWithReply.reply,
                content: messageWithReply.content,
                deleted: messageWithReply.deleted,
                createdAt: messageWithReply.createdAt,
                sender: {
                  slug: session.slug,
                },
              },
            },
          },
        },
      };

      const send = {
        success: true,
        data: {
          type: "receive_message",
          thread: {
            id: thread.slug,
            user: thread.user,
            creator: thread.creator,
            createdAt: thread.createdAt,
            message: {
              id: messageWithReply.id,
              reply: messageWithReply.reply,
              content: messageWithReply.content,
              deleted: messageWithReply.deleted,
              createdAt: messageWithReply.createdAt,
              read: messageWithReply.read,
              sender: {
                slug: session.slug,
              },
            },
          },
        },
      };

      return { send, publish };
    });

    return result;
  } catch (error) {
    if (error instanceof Error) return error;

    console.error(error);

    throw new Error("Unknown error occurred");
  }
}
