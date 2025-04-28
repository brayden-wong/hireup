import { FeatureFlagStatus } from "../constants";

export type FlagDetails = {
  value: boolean;
  status: FeatureFlagStatus;
};
