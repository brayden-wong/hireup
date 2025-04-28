"use client";

import { ArrowLeft } from "lucide-react";

import Link from "next/link";

import { useIsMobile } from "~/lib/hooks/use-mobile";

import { buttonVariants } from "~/components/ui/button";

export const BackButton = () => {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <Link
      href="/jobs"
      className={buttonVariants({
        variant: "ghost",
        className: "w-fit pr-8",
      })}
    >
      <ArrowLeft className="size-4 shrink-0" />
      Back
    </Link>
  );
};
