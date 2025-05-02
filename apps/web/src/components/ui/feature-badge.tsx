import { Sparkles, Clock, Zap } from "lucide-react";
import type { FEATURE_FLAG_STATUS } from "@hireup/common/constants";

import { Badge } from "~/components/ui/badge";

type FeatureBadgeProps = {
  status: (typeof FEATURE_FLAG_STATUS)[number];
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
      return null;
  }
};
