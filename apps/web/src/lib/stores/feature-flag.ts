import { createStore, useStore } from "zustand";
import type { FeatureFlagStatus } from "@hireup/common/constants";

import { useContext } from "react";

import { FeatureFlagContext } from "../contexts/feature-flag-context";

type FeatureFlagState = { flags: Record<string, FeatureFlagStatus> };

type FeatureFlagActions = {
  setFlag: (flag: string, status: FeatureFlagStatus) => void;
};

export type FeatureFlagApi = FeatureFlagState & FeatureFlagActions;

export function createFeatureFlagStore(
  data: Record<string, FeatureFlagStatus>,
) {
  return createStore<FeatureFlagApi>((set) => ({
    flags: data,
    setFlag: (flag, status) =>
      set((state) => ({
        flags: {
          ...state.flags,
          [flag]: status,
        },
      })),
  }));
}
1;

function useFeatureFlags<T>(selector: (state: FeatureFlagApi) => T): T {
  const context = useContext(FeatureFlagContext);

  if (!context)
    throw new Error("useFeatureFlag must be used within a FeatureFlagProvider");

  return useStore(context, selector);
}

export function useFeatureFlag(flag: string) {
  const featureFlag = useFeatureFlags((state) => state.flags[flag]);

  if (!featureFlag) throw new Error(`Feature flag ${flag} does not exist`);

  return featureFlag;
}

export function useSetFeatureFlag() {
  return useFeatureFlags((state) => state.setFlag);
}
