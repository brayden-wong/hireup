import { env } from "~/env";
import { clientRequest, request } from "../utils";
import type { Message, Thread } from "../types/thread";
import { Err, Success } from "../types/response";
import { TypedError } from "./error";

type InfiniteQueryParam = { pageParam: number };

export async function fetchThreads({ pageParam }: InfiniteQueryParam) {
  const response = await clientRequest<
    | Success<{ threads: Thread[]; next?: number }>
    | Err<"User does not exist" | "Session not found">
  >(`${env.API_URL}/api/threads/scroll?pageParam=${pageParam}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.success) throw new Error(response.error);

  return response.data;
}

export async function fetchMessages({
  url,
  session,
  threadId,
  pageParam,
}: InfiniteQueryParam & { url: string; threadId: string; session: string }) {
  const response = await request<
    { messages: Message[]; next?: number },
    "Thread not found" | "User does not exist" | "Session not found"
  >(`${url}/api/threads/${threadId}/infinite?pageParam=${pageParam}`, {
    method: "GET",
    session,
  });

  if (!response.success) throw new TypedError(response.error);

  return response.data;
}
