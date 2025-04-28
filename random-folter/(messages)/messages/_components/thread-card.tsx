"use client";

import { Archive, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { THREADS } from "~/constants/revalidate";
import { useMutation } from "~/lib/hooks/use-mutation";
import { useRevalidate } from "~/lib/hooks/use-revalidate";
import { useThreadStore } from "~/lib/stores/thread-store";
import { useAuthStore } from "~/lib/stores/user-store";
import type { Thread } from "~/lib/types/thread";
import { cn, formatName } from "~/lib/utils";
import { archiveConversation } from "~/server/mutations/conversations";

export const ThreadCard = memo(({ thread }: { thread: Thread }) => {
  const params = useParams<{ id?: string }>();
  const { user } = useAuthStore();

  const name = useMemo(() => {
    if (thread.user.slug === user?.slug)
      return formatName(thread.creator.firstName, thread.creator.lastName);

    if (thread.creator.slug === user?.slug)
      return formatName(thread.user.firstName, thread.user.lastName);

    return formatName(thread.creator.firstName, thread.creator.lastName);
  }, []);

  return (
    <Link
      prefetch
      key={thread.id}
      href={`/messages/${thread.id}`}
      className={cn(
        buttonVariants({
          variant: "outline",
          className:
            "group grid h-14 w-full shrink-0 grid-cols-[auto,1fr,auto] items-center justify-start gap-2 py-0 pl-1 hover:border-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:ring-0",
        }),
        params.id === thread.id &&
          "bg-primary text-primary-foreground focus-visible:border-primary-foreground focus-visible:ring-0",
      )}
    >
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          thread.unread ? "bg-primary" : "",
        )}
      />
      <div className="flex items-start justify-start gap-2 overflow-hidden">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground p-1">
          {name.split(" ").map((c) => c.at(0))}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <span className="truncate">{name}</span>
          <span
            className={cn(
              "truncate text-xs",
              params.id === thread.id ? "opacity-70" : "text-muted-foreground",
            )}
          >
            {thread.messages.at(-1)!.content}
          </span>
        </div>
      </div>
      <ThreadDropdownMenu
        threadId={thread.id}
        match={params.id === thread.id}
      />
    </Link>
  );
});

type ThreadDropdownMenuProps = {
  match: boolean;
  threadId: string;
};

const ThreadDropdownMenu = (props: ThreadDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-6 shrink-0 bg-transparent p-0 hover:bg-transparent">
          <Ellipsis
            className={cn(
              "size-4 text-primary-foreground",
              props.match ? "text-primary-foreground" : "",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <ArchiveThread {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ArchiveThread = ({ threadId }: { threadId: string }) => {
  const router = useRouter();
  const { revalidate } = useRevalidate();
  const { sessionId } = useAuthStore();
  const remove = useThreadStore((state) => state.removeThread);

  const { mutate } = useMutation({
    mutationFn: archiveConversation,
    onError: (err) => toast(err.message),
    onSuccess: async () => {
      await revalidate({ tags: [`${THREADS}:${sessionId}`] });

      setTimeout(() => {
        remove(threadId);
        toast("Thread archived");
      }, 100);

      router.push("/messages");
    },
  });

  const removeThread = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      mutate({ conversationId: threadId });
    },
    [],
  );

  return (
    <DropdownMenuItem>
      <button onClick={removeThread} className="flex w-full items-center gap-2">
        <Archive className="size-4" />
        Archive Thread
      </button>
    </DropdownMenuItem>
  );
};
