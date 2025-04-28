// src/components/FeatureBadge.tsx
// Adjust path to your Badge component
import { Sparkles, Clock, Zap } from "lucide-react";
// Or your icon library
import type { FEATURE_FLAG_STATUS } from "@hireup/common/constants";

import { Badge } from "~/components/ui/badge";

// Adjust path

type FeatureBadgeProps = {
  status: (typeof FEATURE_FLAG_STATUS)[number] | undefined;
};

export const FeatureBadge = ({ status }: FeatureBadgeProps) => {
  switch (status) {
    case "beta":
      return (
        <Badge variant="beta">
          <Sparkles className="mr-1 size-3" />
          Early Access
        </Badge>
      );
    case "soon":
      return (
        <Badge variant="soon">
          <Clock className="mr-1 size-3" />
          Soon
        </Badge>
      );
    case "new":
      return (
        <Badge variant="new">
          <Zap className="mr-1 size-3" />
          New
        </Badge>
      );
    case "enabled":
    case "disabled":
    default:
      // No badge for enabled or disabled states, or unknown states
      return null;
  }
};
