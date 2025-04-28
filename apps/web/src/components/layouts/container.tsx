"use client";

import type { ComponentProps, PropsWithChildren } from "react";

import { useIsMobile } from "~/lib/hooks/use-mobile";
import { cn } from "~/lib/utils";

import { Separator } from "~/components/ui/separator";
import { SidebarTrigger, useSidebar } from "~/components/ui/sidebar";

type Props = ComponentProps<"div">;

export const Container = ({ className, children, ...props }: Props) => {
  const isMobile = useIsMobile();

  return (
    <div
      {...props}
      className={cn(
        "flex h-screen w-full flex-col gap-2 overflow-hidden",
        !isMobile && "max-w-[calc(100vw-19rem)]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const ContainerHeader = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("flex shrink-0 items-center gap-2 p-2", className)}>
    <SidebarTrigger />
    <Separator
      orientation="vertical"
      className="data-[orientation=vertical]:h-7"
    />
    {children}
  </div>
);

export const ContainerContent = ({ className, children, ...props }: Props) => (
  <div
    {...props}
    className={cn(
      "flex h-full flex-1 shrink-0 gap-2 overflow-hidden rounded-md",
      className,
    )}
  >
    {children}
  </div>
);
