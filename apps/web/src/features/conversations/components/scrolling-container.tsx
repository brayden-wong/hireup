import type { PropsWithChildren } from "react";

export const ScrollingContainer = ({
  children,
}: PropsWithChildren<{ className?: string }>) => (
  <div className="flex flex-col overflow-hidden">
    <ol className="flex flex-col gap-2.5 overflow-y-auto py-1">{children}</ol>
  </div>
);
