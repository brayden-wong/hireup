"use client";

import { Archive, ArrowRight, Ellipsis } from "lucide-react";
import { toast } from "sonner";
import superjson from "superjson";
import type { User } from "~/lib/stores/auth-store";
import type { Conversation } from "~/lib/types/conversation";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useDebounce } from "~/lib/hooks/use-debounce";
import { useStreamQuery } from "~/lib/hooks/use-stream-query";
import { useCreateMessageStore } from "~/lib/stores/create-message-store";
import { cn, formatName } from "~/lib/utils";

import { ConversationCard } from "./conversation-card";
import { ScrollingContainer } from "./scrolling-container";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

type Props = {
  active: boolean;
  show: () => void;
  hide: () => void;
};

type SearchConversationResults = {
  noConversations?: User[];
  conversations?: Conversation[];
  archivedConversations?: Conversation[];
};

const default_values = {
  conversations: undefined,
  noConversations: undefined,
  archivedConversations: undefined,
};

export const SearchConversations = memo(({ active, show, hide }: Props) => {
  const [search, setSearch] = useState("");
  const [results, setResults] =
    useState<SearchConversationResults>(default_values);

  const path = usePathname();
  const debounce = useDebounce(search, 500);

  const fetchUsers = useCallback(
    async function* (name: string) {
      if (!name) return null;

      const response = await fetch("/api/search-users", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      if (!response.ok) return null;

      if (!response.body) return null;

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          const chunk = superjson.parse<SearchConversationResults>(
            decoder.decode(value),
          );

          yield chunk;
        }
      }
    },
    [debounce],
  );

  const { error, loading } = useStreamQuery({
    args: debounce,
    queryFn: fetchUsers,
    onData: (chunk) => {
      if ("conversations" in chunk) {
        setResults((prev) => ({
          ...prev,
          conversations: chunk.conversations,
        }));
      }

      if ("noConversations" in chunk) {
        setResults((prev) => ({
          ...prev,
          noConversations: chunk.noConversations,
        }));
      }

      if ("archivedConversations" in chunk) {
        setResults((prev) => ({
          ...prev,
          archivedConversations: chunk.archivedConversations,
        }));
      }
    },
  });

  useEffect(() => {
    if (error) toast(error.message);

    if (!!search && active) {
      show();
      setSearch("");
      setResults(default_values);
    }
  }, [error, path]);

  return (
    <div className="flex-1">
      <div className="relative flex w-full items-center px-2">
        <Input
          value={search}
          onFocus={hide}
          placeholder="Search Messages or People"
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => {
            if (search.length > 0) return;

            show();
            setSearch("");
            setResults(default_values);
          }}
        />
        <ConversationDropdown />
      </div>
      {active && (
        <ScrollingContainer>
          {loading ? (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            results && (
              <div className="space-y-1 px-2">
                {results.conversations && results.conversations.length > 0 && (
                  <>
                    <h3>Conversations</h3>
                    <ol className="flex flex-col gap-2.5">
                      {results.conversations.map((conversation) => (
                        <ConversationCard
                          className="p-0"
                          key={conversation.id}
                          conversation={conversation}
                        />
                      ))}
                    </ol>
                  </>
                )}
                {results.noConversations &&
                  results.noConversations.length > 0 && (
                    <NewMessage data={results.noConversations} />
                  )}
                {results.archivedConversations &&
                  results.archivedConversations.length > 0 && (
                    <>
                      <h3>Archived Conversations</h3>
                      <ol className="flex flex-col gap-2.5">
                        {results.archivedConversations.map((conversation) => (
                          <ConversationCard
                            className="p-0"
                            key={conversation.id}
                            conversation={conversation}
                            href={`/archived/conversations/${conversation.slug}`}
                          />
                        ))}
                      </ol>
                    </>
                  )}
              </div>
            )
          )}
        </ScrollingContainer>
      )}
    </div>
  );
});

const NewMessage = ({ data }: { data: User[] }) => {
  const { message, setMessage } = useCreateMessageStore();

  const item = useMemo(() => {
    if (!message) return { item: null, active: false };

    return data.find((person) => person.id === message.id)
      ? { item: message.id, active: true }
      : { item: null, active: false };
  }, [message]);

  return (
    <>
      <h4>People</h4>
      <ol className="flex flex-col gap-2.5">
        {data.map((person) => {
          const name = formatName(person.firstName, person.lastName);

          return (
            <li key={person.id} className="relative isolate">
              <div
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    className:
                      "ring-primary ring-offset-background relative isolate flex h-14 w-full shrink-0 items-center justify-start gap-2 p-2 ring-offset-2 focus-within:ring-2 hover:ring-2",
                  }),
                  item.active &&
                    item.item === person.id &&
                    "bg-accent ring-primary focus-within:ring-primary ring-2 ring-offset-2 focus-within:ring-2 focus-within:ring-offset-2",
                )}
              >
                <span className="size-2.5 shrink-0" />
                <div className="flex items-center justify-start gap-2 overflow-hidden">
                  <span className="border-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full border p-1">
                    {name.split(" ").map((c) => c.at(0))}
                  </span>
                  <Link
                    href="/conversations"
                    onClick={() => setMessage(person)}
                    className="flex flex-1 flex-col gap-0.5 overflow-hidden focus:outline-none"
                  >
                    <span className="truncate">{name}</span>
                    <span className="text-muted-foreground flex items-center justify-start gap-1 text-xs/4">
                      Start a new conversation
                      <ArrowRight className="size-4" />
                    </span>
                    <span className="absolute inset-0 z-10 h-full w-full" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
};

const ConversationDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="absolute right-3.5">
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-sm" side="bottom" align="end">
        <DropdownMenuItem>
          <Link
            href="/archived/conversations"
            className="flex items-center justify-between gap-4"
          >
            <Archive className="size-4" /> Archived Conversations
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
