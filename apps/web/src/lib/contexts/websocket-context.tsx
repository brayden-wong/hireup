"use client";

import { createContext, PropsWithChildren, useRef } from "react";
import { createWebsocketStore } from "../stores/websocket-store";

type WebsocketAPI = ReturnType<typeof createWebsocketStore>;

export const WebsocketContext = createContext<WebsocketAPI | null>(null);

export const WebsocketProvider = ({ children }: PropsWithChildren) => {
  const store = useRef<WebsocketAPI | null>(null);

  if (!store.current) store.current = createWebsocketStore();

  return (
    <WebsocketContext.Provider value={store.current}>
      {children}
    </WebsocketContext.Provider>
  );
};
