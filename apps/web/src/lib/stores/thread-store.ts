import { createStore, useStore } from "zustand";
import { Message, Thread } from "../types/thread";
import { useContext } from "react";
import { ThreadContext } from "../contexts/thread-context";

type ThreadActions = {
  setThreads: (threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  getThread: (threadId: string) => Thread | null;
  updateThread: (threadId: string, thread: Thread) => void;
  removeThread: (threadId: string) => void;
  addMessages: (
    threadId: string,
    messages: Message[],
    where: "start" | "end",
  ) => void;
};

export type ThreadStore = {
  threads: Thread[];
} & ThreadActions;

export function createThreadStore(threads: Thread[] = []) {
  const store = createStore<ThreadStore>((set, get) => ({
    threads,
    setThreads: (threads) => set({ threads }),
    addThread: (thread) => {
      set(({ threads }) => ({
        threads: [thread, ...threads].sort(
          (a, b) =>
            new Date(b.messages[0]!.createdAt).getTime() -
            new Date(a.messages[0]!.createdAt).getTime(),
        ),
      }));
    },
    updateThread: (threadId, thread) => {
      const getThread = get().getThread;

      const t = getThread(threadId);

      if (!t) return;

      set(({ threads }) => ({
        threads: threads.map((t) => {
          if (t.id === threadId) return thread;

          return t;
        }),
      }));
    },
    removeThread: (threadId) => {
      set(({ threads }) => {
        const thread = threads.find((thread) => thread.id === threadId);

        if (!thread) return { threads };

        return {
          threads: threads.filter((thread) => thread.id !== threadId),
        };
      });
    },
    getThread: (threadId) => {
      const threads = get().threads;

      return threads.find((thread) => thread.id === threadId) ?? null;
    },
    addMessages: (threadId, messages, where) => {
      set(({ threads }) => {
        const thread = threads.find((thread) => thread.id === threadId);

        if (!thread) return { threads };

        thread.messages =
          where === "end"
            ? [...messages, ...thread.messages]
            : [...thread.messages, ...messages];

        return { threads };
      });
    },
  }));

  return store;
}

export function useThreadStore(): ThreadStore;
export function useThreadStore<T>(selector: (state: ThreadStore) => T): T;
export function useThreadStore(selector?: (state: ThreadStore) => any) {
  const context = useContext(ThreadContext);

  if (!context)
    throw new Error("You can only use this store when inside of a context");

  return useStore(context, selector ?? ((state) => state));
}
