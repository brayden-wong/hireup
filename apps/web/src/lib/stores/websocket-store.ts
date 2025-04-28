import { toast } from "sonner";
import superjson from "superjson";
import { createStore, useStore } from "zustand";

import { useContext } from "react";

import { WebsocketContext } from "../contexts/websocket-context";
import { Nullable } from "../types/nullable";
import { env } from "~/env";

export type WebSocketStore = {
  ws: Nullable<WebSocket>;
  disconnect: () => void;
  connect: (sessionId: string) => WebSocket;
  setWs: (ws: Nullable<WebSocket>) => void;
};

function handleMessage(event: MessageEvent, cb: () => void) {
  const message = superjson.parse<
    | { success: false; error: "Session not found" }
    | { success: true; data: { type: "subscribed" } }
  >(event.data);

  if (!message.success) return void toast(message.error);

  cb();
}

export function createWebsocketStore() {
  return createStore<WebSocketStore>()((set, get) => ({
    ws: null,
    setWs: (ws) => set({ ws }),
    connect: (sessionId) => {
      const ws = new WebSocket(
        `${env.NEXT_PUBLIC_API_WS}?sessionId=${sessionId}`,
      );

      ws.onclose = () => {
        set({ ws: null });
      };

      const messageHandler = (event: MessageEvent) =>
        handleMessage(event, () => {
          ws.removeEventListener("message", messageHandler);

          set({ ws });
        });

      ws.addEventListener("message", messageHandler);

      return ws;
    },
    disconnect: () => {
      const { ws } = get();

      if (ws) ws.close();

      set({ ws: null });
    },
  }));
}

export function useWebsocketStore(): WebSocketStore;
export function useWebsocketStore<T>(selector: (state: WebSocketStore) => T): T;
export function useWebsocketStore(selector?: (state: WebSocketStore) => any) {
  const context = useContext(WebsocketContext);

  if (!context)
    throw new Error(
      "useCreateMessageStore must be used within a CreateMessageProvider",
    );

  return useStore(context, selector ?? ((state) => state));
}
