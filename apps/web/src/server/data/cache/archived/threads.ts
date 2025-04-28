// import { request } from "~/lib/utils";
// import { env } from "~/env";
// import { Thread } from "~/lib/types/thread";
// import { THREAD, THREADS } from "~/constants/revalidate";
// import { getSession } from "../utils/get-session";

// import { TypedError } from "~/lib/data/error";
// import { notFound } from "next/navigation";

// const URL = `${env.API_URL}/api/threads`;

// export async function getThreads() {
//   const session = await getSession();

//   if (!session) return new TypedError("No session provided");

//   const response = await request<ThreadsSuccess, ThreadsError>(URL, {
//     session,
//     method: "GET",
//     next: { tags: [`${THREADS}:${session}`] },
//   });

//   if (!response.success) return new TypedError(response.error);

//   return response.data.map(({ lastActive, ...thread }) => ({
//     ...thread,
//     lastActive: new Date(lastActive),
//   }));
// }

// export async function getThread(threadId: string) {
//   const session = await getSession();

//   if (!session) return new TypedError("No session provided");

//   const response = await request<Thread & { archived: boolean }, ThreadError>(
//     `${URL}/${threadId}`,
//     {
//       session,
//       method: "GET",
//       cache: "force-cache",
//       next: { tags: [`${THREAD}:${threadId}`] },
//     },
//   );

//   if (!response.success) {
//     if (response.error === "Thread not found") notFound();

//     return new TypedError(response.error);
//   }

//   return {
//     ...response.data,
//     lastActive: new Date(response.data.lastActive),
//   };
// }

// type ThreadError = "User does not exist" | "Thread not found";

// type ThreadsSuccess = Array<Thread>;

// type ThreadsError = "User does not exist";
