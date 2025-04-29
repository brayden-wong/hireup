import {
  eq,
  ne,
  and,
  count,
  inArray,
  type ExtractTablesWithRelations,
} from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { type database, schema } from "~/packages/db";
import type { ConversationPermission } from "@hireup/common";

type GetUnreadMessagesDb =
  | typeof database
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

export async function getUnreadMessages(
  db: GetUnreadMessagesDb,
  userId: number,
  conversations: number[]
) {
  return await db
    .select({
      unread: count(schema.messages.read),
      conversationId: schema.conversations.id,
    })
    .from(schema.messages)
    .leftJoin(
      schema.conversations,
      eq(schema.messages.conversationId, schema.conversations.id)
    )
    .orderBy(schema.conversations.lastActive)
    .where(
      and(
        eq(schema.messages.read, false),
        ne(schema.messages.senderId, userId),
        inArray(schema.messages.conversationId, conversations)
      )
    )
    .groupBy(schema.conversations.id);
}

type Conversation = {
  id: number;
  slug: string;
  lastActive: Date;
  participants: {
    userId: number;
    permission: ConversationPermission;
    user: {
      slug: string;
      firstName: string;
      lastName: string;
    };
  }[];
  messages: {
    id: number;
    read: boolean;
    content: string;
    deleted: boolean;
    createdAt: Date;
    sender: {
      id: number;
      slug: string;
      firstName: string;
      lastName: string;
    };
    reply: {
      id: number;
      content: string;
      deleted: boolean;
      createdAt: Date;
    } | null;
  }[];
};

type FormatConversation = {
  userId: number;
  conversation: Conversation;
  messages: { conversationId: number | null; unread: number }[];
};

export function formatConversationWithRead(params: FormatConversation) {
  const unread = params.messages.find(
    (c) => c.conversationId === params.conversation.id
  );

  const { participants, ...data } = params.conversation;

  const me = participants.find((p) => p.userId === params.userId);
  const participant = participants.find((p) => p.userId !== params.userId);

  return {
    ...data,
    participant,
    permisssion: me?.permission,
    read: unread ? (unread.unread > 0 ? false : true) : true,
  };
}

type FormatConversationWithoutRead = {
  userId: number;
  conversation: Conversation;
};

export function formatConversationWithoutRead(
  params: FormatConversationWithoutRead
) {
  const me = params.conversation.participants.find(
    (p) => p.userId === params.userId
  );
  const participant = params.conversation.participants.find(
    (p) => p.userId !== params.userId
  );

  const { participants, messages, ...data } = params.conversation;

  return {
    ...data,
    participant,
    permisssion: me?.permission,
    messages: messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    ),
  };
}
