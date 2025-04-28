"use client";

import { createContext, PropsWithChildren, useRef } from "react";
import { createThreadStore } from "../stores/thread-store";
import { Thread } from "../types/thread";

type ThreadAPI = ReturnType<typeof createThreadStore>;

export const ThreadContext = createContext<ThreadAPI | null>(null);

type Props = PropsWithChildren<{
  threads: Thread[];
}>;

export const ThreadProvider = ({ children, threads }: Props) => {
  const store = useRef<ThreadAPI | null>(null);

  if (!store.current) store.current = createThreadStore(threads);

  return (
    <ThreadContext.Provider value={store.current}>
      {children}
    </ThreadContext.Provider>
  );
};
