import { Loader } from "lucide-react";

import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export const LoadingSpinner = ({
  className,
  ...props
}: ComponentProps<"svg">) => (
  <Loader
    {...props}
    className={cn(
      "text-primary size-5 animate-[spin_2s_linear_infinite]",
      className,
    )}
  />
);
