"use client";

import { createContext, useRef, type PropsWithChildren } from "react";
import { createMessageStore } from "../stores/create-message-store";

type CreateMessageAPI = ReturnType<typeof createMessageStore>;

export const CreateMessageContext = createContext<CreateMessageAPI | null>(
  null,
);

export const CreateMessageProvider = ({ children }: PropsWithChildren) => {
  const store = useRef<CreateMessageAPI>();

  if (!store.current) store.current = createMessageStore();

  return (
    <CreateMessageContext.Provider value={store.current}>
      {children}
    </CreateMessageContext.Provider>
  );
};
