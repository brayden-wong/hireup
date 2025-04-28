"use client";

import { useCallback, useState } from "react";
import { ThreadCard } from "./thread-card";
import { useThreadStore } from "~/lib/stores/thread-store";

import { SearchThreads } from "./search-messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Archive, Ellipsis } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

import { ScrollingContainer } from "../../_components/scrolling-container";

export const ThreadList = () => {
  const [showThreads, setShowThreads] = useState(true);
  const { threads } = useThreadStore();

  const show = useCallback(() => setShowThreads(true), []);
  const hide = useCallback(() => setShowThreads(false), []);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-md bg-background">
      <div className="flex items-center gap-2 p-2 pb-1">
        <SearchThreads active={!showThreads} show={show} hide={hide} />
        <ThreadDropdown />
      </div>
      {showThreads && (
        <ScrollingContainer>
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </ScrollingContainer>
      )}
    </div>
  );
};

const ThreadDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-sm" side="bottom" align="start">
        <DropdownMenuItem>
          <Link
            href="/archived/messages"
            className="flex items-center justify-between gap-4"
          >
            Archived Threads <Archive className="size-4" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
