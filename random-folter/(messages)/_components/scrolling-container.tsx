import type { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export const ScrollingContainer = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("flex-1 overflow-hidden pb-2 pl-2 pr-1 pt-1", className)}>
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
      {children}
    </div>
  </div>
);
