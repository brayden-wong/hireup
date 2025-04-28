"use client";

import { createContext, PropsWithChildren, useRef } from "react";

import {
  createFeatureFlagStore,
  FeatureFlagData,
} from "../stores/feature-flag";
import { Nullable } from "../types/nullable";

type FeatureFlagContextType = ReturnType<typeof createFeatureFlagStore>;

export const FeatureFlagContext =
  createContext<Nullable<FeatureFlagContextType>>(null);

type Props = PropsWithChildren<{
  featureFlags: FeatureFlagData;
  flags: FeatureFlagData;
}>;

export const FeatureFlagProvider = ({ children, ...data }: Props) => {
  const store = useRef<Nullable<FeatureFlagContextType>>(null);

  if (!store.current) store.current = createFeatureFlagStore(data);

  return (
    <FeatureFlagContext.Provider value={store.current}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
