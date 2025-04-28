"use client";

import { Archive, Ellipsis } from "lucide-react";
import { toast } from "sonner";
import type { Conversation } from "~/lib/types/conversation";

import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { archiveConversation } from "~/server/mutations/conversations";

import { useMutation } from "~/lib/hooks/use-mutation";
import { useRevalidate } from "~/lib/hooks/use-revalidate";
import { useSession } from "~/lib/stores/auth-store";
import { cn, formatName } from "~/lib/utils";

import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CONVERSATIONS } from "~/constants/revalidate";

type Props = {
  href?: string;
  className?: string;
  conversation: Conversation;
};

export const ConversationCard = memo(
  ({ href, conversation, className }: Props) => {
    const params = useParams<{ slug?: string }>();

    const name = useMemo(() => {
      return formatName(
        conversation.participant.user.firstName,
        conversation.participant.user.lastName,
      );
    }, []);

    return (
      <li className={cn("px-2", className)}>
        <div
          className={cn(
            buttonVariants({
              variant: "outline",
              className:
                "ring-primary ring-offset-background relative isolate flex h-14 w-full shrink-0 items-center justify-start gap-2 p-2 ring-offset-2 focus-within:ring-2 hover:ring-2",
            }),
            params.slug === conversation.slug &&
              "text-primary-foreground bg-accent ring-2 focus-visible:ring-0",
          )}
        >
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              !conversation.read && "bg-primary",
            )}
          />
          <div className="flex flex-1 items-start justify-start gap-2 overflow-hidden">
            <div className="border-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full border p-1">
              {name.split(" ").map((c) => c.at(0))}
            </div>
            <Link
              href={href ?? `/conversations/${conversation.slug}`}
              className="flex flex-1 flex-col gap-0.5 overflow-hidden focus:outline-none"
            >
              <span className="truncate">{name}</span>
              <span
                className={cn(
                  "truncate text-xs",
                  params.slug === conversation.slug
                    ? "opacity-70"
                    : "text-muted-foreground",
                )}
              >
                {conversation.messages.at(-1)!.content}
                <span className="absolute inset-0 z-10 h-full w-full" />
              </span>
            </Link>
          </div>
          <ConversationDropdown
            conversationId={conversation.id}
            match={params.slug === conversation.slug}
            render={conversation.permission === "owner"}
          />
        </div>
      </li>
    );
  },
);

type ConversationDropdownMenuProps = {
  match: boolean;
  render: boolean;
  conversationId: number;
};

const ConversationDropdown = (props: ConversationDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="z-20 size-6 shrink-0 p-0">
          <Ellipsis
            className={cn(
              "text-primary-foreground size-4",
              props.match ? "text-primary-foreground" : "",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <ArchiveConversation {...props} />
        <ArchiveWholeConversation
          render={props.render}
          conversationId={props.conversationId}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ArchiveConversation = ({
  conversationId,
}: {
  conversationId: number;
}) => {
  const router = useRouter();
  const { revalidate } = useRevalidate();
  const sessionId = useSession();
  // const remove = useConversationStore((state) => state.removeConversation);

  const { mutate } = useMutation({
    mutationFn: archiveConversation,
    onError: (err) => toast(err.message),
    onSuccess: async () => {
      await revalidate({ tags: [`${CONVERSATIONS}:${sessionId}`] });

      setTimeout(() => {
        // remove(conversationId);
        toast("Thread archived");
      }, 100);

      router.push("/messages");
    },
  });

  const removeConversation = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      mutate({ conversationId });
    },
    [],
  );

  return (
    <DropdownMenuItem>
      <button
        onClick={removeConversation}
        className="flex w-full items-center gap-2"
      >
        <Archive className="size-4" />
        Archive Thread
      </button>
    </DropdownMenuItem>
  );
};

type ArchiveWholeConversationProps = {
  render: boolean;
  conversationId: number;
};

const ArchiveWholeConversation = ({
  render,
}: ArchiveWholeConversationProps) => {
  if (!render) return null;

  return (
    <DropdownMenuItem>
      <button>
        <Archive className="size-4" />
        Archive Entire Conversation
      </button>
    </DropdownMenuItem>
  );
};
