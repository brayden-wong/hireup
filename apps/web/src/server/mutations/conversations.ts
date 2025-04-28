"use server";

import { TypedError } from "~/lib/data/error";
import { Conversation } from "~/lib/types/conversation";
import { request } from "~/lib/utils";

import { getSession } from "../utils/get-session";
import { env } from "~/env";

type CreateConversationParams = {
  userId: number;
  content: string;
};

export async function createConversation(params: CreateConversationParams) {
  const session = await getSession();

  if (!session) throw new TypedError("No session provided");

  const response = await request<Conversation>(
    `${env.API_URL}/api/conversations`,
    {
      session,
      method: "POST",
    },
  );

  if (!response.success) throw new TypedError(response.error);

  return response.data;
}

type ArchiveConversationPayload = {
  conversationId: number;
};

export async function archiveConversation({
  conversationId,
}: ArchiveConversationPayload) {
  const session = await getSession();

  if (!session) throw new TypedError("No session provided");

  const response = await request(
    `${env.API_URL}/api/conversations/${conversationId}/archive`,
    {
      session,
      method: "POST",
    },
  );

  return response;
}

export async function unarchiveConversation({
  conversationId,
}: ArchiveConversationPayload) {
  const session = await getSession();

  if (!session) throw new TypedError("No session provided");

  const response = await request<
    { unarchived: Conversation },
    "Thread not found"
  >(`${env.API_URL}/api/conversations/${conversationId}/unarchive`, {
    session,
    method: "POST",
  });

  if (!response.success) throw new TypedError(response.error);

  return response.data.unarchived;
}
