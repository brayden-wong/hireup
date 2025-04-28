// import "client-only";

// import { useParams, usePathname, useRouter } from "next/navigation";
// import { useWebsocketStore } from "../stores/websocket-store";
// import { useThreadStore } from "../stores/thread-store";
// import { useEffect } from "react";
// import { WebsocketMessage } from "../types/websocket-messages";
// import { toast } from "sonner";
// import { formatName } from "../utils";
// import { useAuthStore } from "../stores/user-store";
// import { useRevalidate } from "./use-revalidate";
// import { CONVERSATIONS, THREADS } from "~/constants/revalidate";

// export function useWebsocketListener() {
//   const router = useRouter();
//   const path = usePathname();
//   const { user, sessionId } = useAuthStore();
//   const { ws } = useWebsocketStore();
//   const { invalidate } = useRevalidate();
//   const params = useParams<{ id?: string }>();
//   const { addThread, getThread, updateThread } = useThreadStore();

//   useEffect(() => {
//     if (!ws) return;

//     ws.onmessage = async (event: MessageEvent<WebsocketMessage>) => {
//       const message = JSON.parse(event.data);

//       if (!message.success) return toast(message.error);

//       switch (message.data.type) {
//         case "created_thread":
//           addThread(message.data.thread);

//           toast("Thread created");

//           invalidate({ tags: [THREADS] });

//           router.push(`/messages/${message.data.thread.id}`);

//           break;
//         case "receive_message":
//           const thread = getThread(message.data.thread.id);

//           if (!thread) {
//             toast("You've been added to a new thread");

//             addThread({
//               ...message.data.thread,
//               messages: [message.data.thread.message],
//             });

//             invalidate({ tags: [THREADS] });
//           } else {
//             const name = formatName(
//               message.data.thread.user.firstName,
//               message.data.thread.user.lastName,
//             );

//             if (params.id !== message.data.thread.id)
//               toast(`${name} send you a message`, {
//                 action: {
//                   label: "view",
//                   onClick: () =>
//                     router.push(`/messages/${message.data.thread.id}`),
//                 },
//               });

//             if (!thread) return;

//             updateThread(message.data.thread.id, {
//               ...thread,
//               unread:
//                 message.data.thread.user.slug === user?.slug &&
//                 !path.endsWith(`/${message.data.thread.id}`),
//               messages: [...thread.messages, message.data.thread.message],
//             });

//             invalidate({
//               tags: [
//                 `${THREADS}:${sessionId}`,
//                 `${CONVERSATIONS}:${message.data.thread.id}`,
//               ],
//             });
//           }

//           break;
//       }
//     };
//   }, [ws, router, path]);

//   return ws;
// }
