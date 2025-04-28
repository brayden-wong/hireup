import { createStore, useStore } from "zustand";

import { useContext } from "react";

import { Nullable } from "~/lib/types/nullable";

import { HeaderContext } from "../context/header-context";

type Header = {
  name: string;
  href: string;
};

type HeaderState = {
  header: Nullable<Header>;
};

type HeaderActions = {
  setHeader: (header: Nullable<Header>) => void;
};

type HeaderStore = HeaderState & HeaderActions;

export function createHeaderStore() {
  return createStore<HeaderStore>((set) => ({
    header: null,
    setHeader: (header) => set({ header }),
  }));
}

export function useNameStore<T>(selector: (state: HeaderStore) => T) {
  const context = useContext(HeaderContext);

  if (!context)
    throw new Error("useHeaderStore must be used within a HeaderProvider");

  return useStore(context, selector);
}
