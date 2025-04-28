// import { request } from "~/lib/utils";
// import { getSession } from "../utils/get-session";
// import { env } from "~/env";
// import { ARCHIVED_THREADS } from "~/constants/revalidate";
// import { Thread } from "~/lib/types/thread";
// import { TypedError } from "~/lib/data/error";

// export async function getArchivedThreads() {
//   const session = await getSession();

//   if (!session) return null;

//   const response = await request<Thread[], "User does not exist">(
//     `${env.API_URL}/api/archived/threads`,
//     {
//       session,
//       method: "GET",
//       next: { tags: [`${ARCHIVED_THREADS}:${session}`] },
//     },
//   );

//   if (!response.success) return new TypedError(response.error);

//   return response.data;
// }
