import type { PropsWithChildren } from "react";

export const Pill = ({ children }: PropsWithChildren) => (
  <span className="bg-muted flex items-center justify-center rounded-full px-2 py-1 text-xs">
    {children}
  </span>
);
