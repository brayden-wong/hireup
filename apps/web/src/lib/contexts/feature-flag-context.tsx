"use client";

import { createContext, PropsWithChildren, useRef } from "react";

import { createFeatureFlagStore } from "../stores/feature-flag";
import { Nullable } from "../types/nullable";
import { FeatureFlagStatus } from "@hireup/common/constants";

type FeatureFlagContextType = ReturnType<typeof createFeatureFlagStore>;

export const FeatureFlagContext =
  createContext<Nullable<FeatureFlagContextType>>(null);

type Props = PropsWithChildren<{
  flags: Record<string, FeatureFlagStatus>;
}>;

export const FeatureFlagProvider = ({ children, flags }: Props) => {
  const store = useRef<Nullable<FeatureFlagContextType>>(null);

  if (!store.current) store.current = createFeatureFlagStore(flags);

  return (
    <FeatureFlagContext.Provider value={store.current}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
