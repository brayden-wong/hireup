// import { useEffect } from "react";

// import { useAuthStore } from "../stores/user-store";
// import { env } from "~/env";

// export function useWebsocket() {
//   const { sessionId } = useAuthStore();

//   useEffect(() => {
//     const ws = new WebSocket(
//       `${env.NEXT_PUBLIC_API_WS}?sessionId=${sessionId}`,
//     );

//     ws.onopen = () => {
//       console.log("connected");
//     };

//     ws.onmessage = ({ data }: MessageEvent) => {
//       console.log("INCOMING DATA", JSON.parse(data));
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);

//   return null;
// }
