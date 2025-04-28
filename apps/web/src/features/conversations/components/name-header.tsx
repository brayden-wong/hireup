"use client";

import { ChevronRight } from "lucide-react";

import Link from "next/link";

import { useNameStore } from "../store/header-store";

export const NameHeader = () => {
  const header = useNameStore((state) => state.header);

  if (!header)
    return (
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-lg font-medium">Conversations</h1>
      </div>
    );

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href="/conversations"
        className="focus:ring-primary rounded-md px-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        <h1 className="text-lg font-medium">Conversations</h1>
      </Link>
      <ChevronRight className="size-5" />
      <h2>{header.name}</h2>
    </div>
  );
};
