import { createStore, useStore } from "zustand";
import type { FeatureFlag } from "@hireup/common/constants";
import type { FlagDetails } from "@hireup/common/types";

import { useContext } from "react";

import { FeatureFlagContext } from "../contexts/feature-flag-context";

export type FeatureFlagData = Record<FeatureFlag, FlagDetails>;

type FeatureFlagState = {
  featureFlags: FeatureFlagData;
  flags: FeatureFlagData;
};

type FeatureFlagActions = {
  setFlag: (flag: FeatureFlag, details: Partial<FlagDetails>) => void;
};

export type FeatureFlagApi = FeatureFlagState & FeatureFlagActions;

export function createFeatureFlagStore(data: FeatureFlagState) {
  return createStore<FeatureFlagApi>((set) => ({
    ...data,
    setFlag: (flag, details) =>
      set((state) => {
        return {
          ...state,
          featureFlags: {
            ...state.featureFlags,
            [flag]: {
              ...state.featureFlags[flag],
              ...details,
            },
          },
        };
      }),
  }));
}

function useFeatureFlag<T>(selector: (state: FeatureFlagApi) => T): T {
  const context = useContext(FeatureFlagContext);

  if (!context)
    throw new Error("useFeatureFlag must be used within a FeatureFlagProvider");

  return useStore(context, selector);
}

export function useFeatureFlags() {
  return useFeatureFlag((state) => state.featureFlags);
}

export function useConversationsFlag() {
  return useFeatureFlag((state) => state.flags.conversations);
}

export function useJobsFlag() {
  return useFeatureFlag((state) => state.flags.jobs);
}
