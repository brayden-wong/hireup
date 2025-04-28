"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { useThreadStore } from "~/lib/stores/thread-store";
import { Thread } from "~/lib/types/thread";
import { cn } from "~/lib/utils";

export const UpdateThread = ({
  thread,
  children,
}: PropsWithChildren<{ thread: Thread }>) => {
  const [updating, setUpdating] = useState(true);
  const { updateThread } = useThreadStore();

  useEffect(() => {
    updateThread(thread.id, thread);

    setUpdating(false);
  }, []);

  if (updating)
    return (
      <div className="grid h-full w-full grid-rows-[1fr,auto] gap-2 rounded-md bg-background p-2">
        <div className="relative flex grow flex-col gap-2 overflow-y-auto pr-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const width = Math.floor(Math.random() * 50) + 10;
            const side = Math.random() > 0.5 ? "left" : "right";

            return (
              <div
                key={i}
                suppressHydrationWarning
                className={cn(
                  "flex w-full",
                  side === "right" ? "justify-end" : "justify-start",
                )}
              >
                <div className="flex max-w-[70%] items-center gap-2">
                  <Skeleton
                    className={cn("h-9")}
                    suppressHydrationWarning
                    style={{ width: `${width}rem` }}
                  />
                </div>
              </div>
            );
          })}
          <Skeleton className="h-10 w-full shrink-0" />
        </div>
      </div>
    );

  return children;
};
