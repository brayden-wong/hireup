import type { CONVERSATION_NOT_FOUND } from "@hireup/common/error";

import { unstable_cache as cache } from "next/cache";

import { getSession } from "~/server/utils/get-session";

import { Conversation } from "~/lib/types/conversation";
import { Nullable } from "~/lib/types/nullable";
import { request } from "~/lib/utils";

import { CONVERSATION, CONVERSATIONS } from "~/constants/revalidate";
import { env } from "~/env";

export async function getConversations() {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = new Date();
      const response = await request<Conversation[]>(
        `${env.API_URL}/api/conversations`,
        {
          session,
          method: "GET",
        },
      );

      console.info(
        `get-conversations: ${new Date().getTime() - start.getTime()}ms`,
      );

      return response.success ? response.data : response.error;
    },
    [`${CONVERSATIONS}:${session}`],
    { revalidate: 60, tags: [`${CONVERSATIONS}:${session}`] },
  );

  return fn();
}

export async function getConversation(slug: string) {
  const session = await getSession();

  if (!session) return null;

  const fn = cache(
    async () => {
      const start = new Date();
      const response = await request<
        { conversation: Conversation; next: Nullable<number> },
        typeof CONVERSATION_NOT_FOUND
      >(`${env.API_URL}/api/conversations/${slug}`, {
        session,
        method: "GET",
      });

      console.info(
        `get-conversation: ${new Date().getTime() - start.getTime()}ms`,
      );

      return response.success ? response.data : response.error;
    },
    [slug],
    { revalidate: 60, tags: [CONVERSATION] },
  );

  return fn();
}
