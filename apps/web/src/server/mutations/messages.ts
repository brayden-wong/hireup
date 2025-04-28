"use server";

import type { SendMessage } from "~/lib/schemas/send-message-schema";

import { TypedError } from "~/lib/data/error";
import { Message } from "~/lib/types/messages";
import { Thread } from "~/lib/types/thread";
import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { env } from "~/env";

export async function createMessage({ conversationId, ...data }: SendMessage) {
  const session = await getSession();

  if (!session) throw new TypedError("Unauthorized");

  console.log(data);

  const response = await request<Message>(
    `${env.API_URL}/api/conversations/${conversationId}/messages`,
    {
      session,
      method: "POST",
      body: JSON.stringify(data),
    },
  );

  if (!response.success) throw new Error(response.error);

  return response.data;
}

export async function deleteMessage({
  threadId,
  messages,
  messageId,
}: {
  threadId: string;
  messages: number;
  messageId: number;
}) {
  const session = await getSession();

  if (!session) throw new TypedError("Unauthorized");

  const response = await request<
    { updatedThread: Thread },
    "Thread not found" | "Message not found" | "User not found"
  >(`${env.API_URL}/api/threads/${threadId}/messages/${messageId}`, {
    session,
    method: "DELETE",
    body: JSON.stringify({ messages }),
  });

  if (!response.success) throw new Error(response.error);

  const { messages: newMessages, ...data } = response.data.updatedThread;

  return {
    ...data,
    messages: newMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  };
}
