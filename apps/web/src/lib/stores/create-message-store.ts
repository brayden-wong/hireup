import { createStore, useStore } from "zustand";
import type { User } from "./auth-store";

import { useContext } from "react";

import { CreateMessageContext } from "../contexts/create-message-context";
import { Nullable } from "../types/nullable";

export type CreateMessage = Nullable<User>;

type Message = {
  message: CreateMessage;
};

type CreateMessageActions = {
  setMessage(message: CreateMessage): void;
};

type CreateMessageStore = Message & CreateMessageActions;

export function createMessageStore() {
  return createStore<Message & CreateMessageActions>()((set) => ({
    message: null,
    setMessage: (message) => set({ message }),
  }));
}

export function useCreateMessageStore(): CreateMessageStore;
export function useCreateMessageStore<T>(
  selector: (state: CreateMessageStore) => T,
): T;
export function useCreateMessageStore<T>(
  selector?: (state: CreateMessageStore) => any,
) {
  const context = useContext(CreateMessageContext);

  if (!context)
    throw new Error(
      "useCreateMessageStore must be used within a CreateMessageProvider",
    );

  return useStore(context, selector ?? ((state) => state));
}
