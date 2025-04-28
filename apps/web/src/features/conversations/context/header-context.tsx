"use client";

import type { PropsWithChildren } from "react";

import { createContext, useRef } from "react";

import { Nullable } from "~/lib/types/nullable";

import { createHeaderStore } from "../store/header-store";

type HeaderStoreApi = ReturnType<typeof createHeaderStore>;

export const HeaderContext = createContext<Nullable<HeaderStoreApi>>(null);

export const HeaderProvider = ({ children }: PropsWithChildren) => {
  const store = useRef<Nullable<HeaderStoreApi>>(null);

  if (!store.current) store.current = createHeaderStore();

  return (
    <HeaderContext.Provider value={store.current}>
      {children}
    </HeaderContext.Provider>
  );
};
