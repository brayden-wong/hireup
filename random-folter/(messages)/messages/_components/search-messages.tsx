import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchUsersResponse } from "~/app/api/search-users/route";
import { Input } from "~/components/ui/input";
import { useDebounce } from "~/lib/hooks/use-debounce";
import { useQuery } from "~/lib/hooks/use-query";
import { clientRequest, cn } from "~/lib/utils";
import { ScrollingContainer } from "../../_components/scrolling-container";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { useCreateMessageStore } from "~/lib/stores/create-message-store";

type SearchThreadProps = {
  active: boolean;
  show: () => void;
  hide: () => void;
};

export const SearchThreads = ({ active, show, hide }: SearchThreadProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debounce = useDebounce(search, 500);
  const path = usePathname();

  const fetchUsers = useCallback(
    async (name: string) => {
      if (!name) return null;

      const response = await clientRequest<SearchUsersResponse>(
        "/api/search-users",
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ name }),
        },
      );

      if (!response.success) return router.push("/auth");

      const { withThread, withoutThread, archivedThreads } = response.data;

      return {
        local: withThread,
        new: withoutThread,
        archived: archivedThreads,
      };
    },
    [debounce],
  );

  const { data, error, loading } = useQuery({
    args: debounce,
    queryFn: fetchUsers,
  });

  useEffect(() => {
    if (!!search && active) {
      setSearch("");
      show();
    }
  }, [path]);

  return (
    <>
      <Input
        value={search}
        onBlur={() => {
          if (search.length > 0) return;

          show();
        }}
        onFocus={hide}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search Messages or People"
      />
      {active && (
        <ScrollingContainer>
          {loading ? (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <p>Error {error.message}</p>
          ) : data ? (
            <>
              {data.local.length > 0 && (
                <>
                  <h4>Messages</h4>
                  <ul className="flex flex-col gap-2">
                    {data.local.map((thread) => (
                      <li key={thread.id}>
                        <Link
                          href={`/messages/${thread.thread}`}
                          onClick={(e) => {
                            e.preventDefault();

                            setSearch("");

                            show();
                            router.push(`/messages/${thread.thread}`);
                          }}
                        >
                          <Button
                            variant="outline"
                            className="h-14 w-full shrink-0 items-center justify-start gap-2 px-4 py-0 hover:border-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:ring-0"
                          >
                            <div className="flex items-start justify-start gap-2 overflow-hidden">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground p-1 uppercase">
                                {thread.name.split(" ").map((c) => c.at(0))}
                              </span>
                              <div className="flex flex-1 flex-col items-start justify-start gap-0.5 overflow-hidden">
                                <span className="truncate">{thread.name}</span>
                                <span
                                  className={cn(
                                    "truncate text-left text-xs text-muted-foreground",
                                  )}
                                >
                                  {thread.content}
                                </span>
                              </div>
                            </div>
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {data.new.length > 0 && <NewMessage data={data.new} />}
              {data.archived.length > 0 && (
                <>
                  <h4>Archived Messages</h4>
                  <ul>
                    {data.archived.map((thread) => (
                      <li key={thread.id}>
                        <Link
                          href={`/messages/${thread.thread}`}
                          onClick={(e) => {
                            e.preventDefault();

                            setSearch("");

                            show();
                            router.push(`/messages/${thread.thread}`);
                          }}
                        >
                          <Button
                            variant="outline"
                            className="h-14 w-full shrink-0 items-center justify-start gap-2 px-4 py-0 hover:border-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:ring-0"
                          >
                            <div className="flex items-start justify-start gap-2 overflow-hidden">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground p-1">
                                {thread.name.split(" ").map((c) => c.at(0))}
                              </span>
                              <div className="flex flex-1 flex-col items-start justify-start gap-0.5 overflow-hidden">
                                <span className="truncate">{thread.name}</span>
                                <span
                                  className={cn(
                                    "truncate text-left text-xs text-muted-foreground",
                                  )}
                                >
                                  {thread.content}
                                </span>
                              </div>
                            </div>
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : null}
        </ScrollingContainer>
      )}
    </>
  );
};

const NewMessage = ({ data }: { data: { id: string; name: string }[] }) => {
  const router = useRouter();
  const { message, setMessage } = useCreateMessageStore();

  const active = useMemo(() => {
    if (!message) return false;

    return data.find(
      (person) => person.id === message.id && person.name === message.name,
    );
  }, [message]);

  return (
    <>
      <h4>People</h4>
      <ul>
        {data.map((person) => (
          <li key={person.id}>
            <Button
              variant="outline"
              onClick={() => {
                setMessage(person);
                router.push("/messages");
              }}
              className={cn(
                "h-14 w-full shrink-0 items-center justify-start gap-2 px-4 py-0 hover:border-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:ring-0",
                active &&
                  "bg-primary text-primary-foreground focus-visible:border-primary-foreground focus-visible:ring-0",
              )}
            >
              <div className="flex items-center justify-start gap-2 overflow-hidden">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground p-1">
                  {person.name.split(" ").map((c) => c.at(0))}
                </span>
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <span className="truncate">{person.name}</span>
                </div>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
};
