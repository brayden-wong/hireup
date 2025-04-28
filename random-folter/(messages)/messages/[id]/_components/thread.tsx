"use client";

import { SendMessageForm } from "../../../_components/send-message-form";
import { cn, formatName } from "~/lib/utils";
import { useThreadStore } from "~/lib/stores/thread-store";
import { notFound, useParams, useRouter } from "next/navigation";
import { formatRelative } from "date-fns";
import {
  createContext,
  FormEvent,
  memo,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Message } from "~/lib/types/thread";
import { Nullable } from "~/lib/types/nullable";
import { createStore, useStore } from "zustand";
import { Reply, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { useWebsocketStore } from "~/lib/stores/websocket-store";
import { useAuthStore } from "~/lib/stores/user-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { deleteMessage } from "~/server/mutations/messages";
import { toast } from "sonner";
import { SubmitButton } from "~/components/ui/submit-button";
import { fetchMessages } from "~/lib/data/messages";
import { useInView } from "react-intersection-observer";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { INITIAL_MESSAGE_LIMIT } from "~/constants/initial-message-limit";

type ThreadProps = {
  id: string;
  url: string;
};

export const Thread = ({ url, id }: ThreadProps) => {
  const { threads, getThread } = useThreadStore();
  const { user } = useAuthStore();

  const thread = useMemo(() => {
    const thread = getThread(id);

    if (!thread) notFound();

    return thread;
  }, [id, threads]);

  const name = useMemo(() => {
    if (thread.user.slug === user?.slug)
      return formatName(thread.creator.firstName, thread.creator.lastName);

    return formatName(thread.user.firstName, thread.user.lastName);
  }, []);

  const slug = useMemo(() => {
    return user!.slug;
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useWebsocketListener(thread.id);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <ReplyMessageProvider>
      <main className="grid h-full w-full grid-rows-[1fr,auto] gap-2 rounded-md bg-background p-2">
        <Messages
          url={url}
          slug={slug}
          scrollRef={messagesEndRef}
          messages={thread.messages}
        />
        <SendMessageForm
          name={name}
          thread={thread.id}
          onFocus={scrollToBottom}
        />
      </main>
    </ReplyMessageProvider>
  );
};

type MessagesProps = {
  url: string;
  slug: string;
  messages: Message[];
  scrollRef: RefObject<HTMLDivElement>;
};

const Messages = ({ url, slug, messages, scrollRef }: MessagesProps) => {
  const { authenticated, sessionId } = useAuthStore();
  const loadRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    root: loadRef.current,
  });

  const isFirstRender = useRef(true);
  const { addMessages } = useThreadStore();
  const [canFetch, setCanFetch] = useState(false);
  const { id: threadId } = useParams<{ id: string }>();

  const prevMessage = useRef(messages[messages.length - 1]!);

  const scroll = useCallback(() => {
    scrollRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? "instant" : "smooth",
    });
  }, [scrollRef, isFirstRender]);

  const scrollToMessage = useCallback((id: `message:${number}:${string}`) => {
    const element = document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const shouldShowTimestamp = useCallback(
    (currentMsg: Message, prevMsg?: Message) => {
      if (!prevMsg) return true;

      const currentTime = new Date(currentMsg.createdAt);
      const prevTime = new Date(prevMsg.createdAt);
      const diffInMinutes =
        (currentTime.getTime() - prevTime.getTime()) / (1000 * 60);

      return diffInMinutes >= 10;
    },
    [messages],
  );

  const formatMessageTime = useCallback(
    (date: Date) => formatRelative(date, new Date()),
    [messages],
  );

  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["messages", threadId],
    queryFn: ({ pageParam }) => {
      if (!authenticated)
        return {
          messages: [],
          next: undefined,
        };

      return fetchMessages({
        url,
        threadId,
        pageParam,
        session: sessionId,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    initialData: {
      pages: [{ messages: messages, next: 1 }],
      pageParams: [0],
    },
  });

  const pageData = useMemo(() => {
    return {
      page: data.pages[data.pages.length - 1]!,
      firstPage: data.pages.length === 1,
    };
  }, [data.pages.length]);

  useEffect(() => {
    const scrollToBottom = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));

      const messagesEnd = document.getElementById("messages-end");
      if (!messagesEnd) return scrollToBottom();

      const observer = new ResizeObserver(() => {
        messagesEnd.scrollIntoView({ behavior: "instant" });
        observer.disconnect();
      });

      observer.observe(messagesEnd.parentElement!);

      isFirstRender.current = false;

      const timeout = setTimeout(() => {
        setCanFetch(true);
      }, 1_000);

      return () => {
        observer.disconnect();
        clearTimeout(timeout);
      };
    };

    scrollToBottom();
  }, []);

  useEffect(() => {
    const message = messages[messages.length - 1]!;

    if (prevMessage.current.createdAt === message.createdAt) return;

    scroll();
    prevMessage.current = message;
  }, [messages]);

  useEffect(() => {
    if (!pageData.page || pageData.firstPage) return;

    addMessages(threadId, pageData.page.messages, "end");

    if (loadRef.current)
      loadRef.current.scrollTo({ top: 5, behavior: "smooth" });
  }, [pageData]);

  useEffect(() => {
    if (
      inView &&
      canFetch &&
      pageData.page?.next &&
      !isFetchingNextPage &&
      messages.length >= INITIAL_MESSAGE_LIMIT
    ) {
      fetchNextPage();
      setCanFetch(false);

      setTimeout(() => {
        setCanFetch(true);
      }, 250);
    }
  }, [inView, isFetchingNextPage, fetchNextPage, canFetch]);

  return (
    <div
      ref={loadRef}
      className="relative flex flex-col gap-2 overflow-y-auto pr-2"
    >
      <div ref={ref} id="messages-start" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      {messages.map((message, index) => {
        return (
          <div key={`${message.id}:${index}`} className="flex flex-col gap-1">
            {shouldShowTimestamp(message, messages[index - 1]) && (
              <div className="flex justify-center">
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {formatMessageTime(new Date(message.createdAt))}
                </span>
              </div>
            )}
            <div
              className={cn(
                "flex w-full",
                message.sender.slug === slug ? "justify-end" : "justify-start",
              )}
            >
              <div className="flex max-w-[70%] items-center gap-2">
                <div className="flex w-full flex-col gap-1">
                  {message.reply && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() =>
                          scrollToMessage(
                            `message:${message.reply!.id}:${slug}`,
                          )
                        }
                        className="max-w-72 rounded-md border border-primary/80 px-2 py-1 text-left text-xs text-primary/80"
                      >
                        <p className="line-clamp-3">{message.reply.content}</p>
                      </button>
                      <div
                        className={cn(
                          "right-0 flex h-4",
                          message.sender.slug === slug
                            ? "justify-end pl-[1px]"
                            : "justify-start pr-[1px]",
                        )}
                      >
                        <div className="h-full w-[2px] rounded-full bg-primary opacity-40" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "group flex gap-2",
                      message.sender.slug === slug
                        ? "justify-start"
                        : "justify-end",
                    )}
                  >
                    {message.sender.slug === slug && !message.deleted && (
                      <ReplyButton scroll={scroll} message={message} />
                    )}
                    {message.sender.slug === slug ? (
                      !!message.deleted ? (
                        <span className="text-sm text-muted-foreground">
                          message deleted
                        </span>
                      ) : (
                        <MessageContext
                          slug={slug}
                          scroll={scroll}
                          message={message}
                        />
                      )
                    ) : !!message.deleted ? (
                      <span className="text-sm text-muted-foreground">
                        message deleted
                      </span>
                    ) : (
                      <span
                        id={`message:${message.id}:${message.sender.slug}`}
                        className={cn(
                          "rounded-lg px-3 py-2",
                          message.sender.slug === slug
                            ? "bg-primary"
                            : "bg-secondary",
                        )}
                      >
                        {message.content}
                      </span>
                    )}
                    {message.sender.slug !== slug && !message.deleted && (
                      <ReplyButton scroll={scroll} message={message} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} id="messages-end" />
    </div>
  );
};

const ReplyButton = memo(
  ({ message, scroll }: { message: Message; scroll: () => void }) => {
    const { setMessage } = useReplyStore();

    const reply = useCallback(() => {
      setMessage(message);

      setTimeout(() => {
        scroll();
      }, 0);
    }, [message]);

    return (
      <button
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={reply}
      >
        <Reply className="size-4" />
      </button>
    );
  },
);

const MessageContext = memo(
  ({
    slug,
    scroll,
    message,
  }: {
    slug: string;
    message: Message;
    scroll: () => void;
  }) => {
    const { getThread, updateThread } = useThreadStore();
    const [open, onOpenChange] = useState(false);
    const [delMessage, setDelMessage] = useState(false);
    const { id: threadId } = useParams<{ id: string }>();

    const { setMessage } = useReplyStore();

    const { mutate, isPending } = useMutation({
      mutationFn: deleteMessage,
      onError: (err) => toast(err.message),
      onSuccess: (thread) => {
        toast("Message deleted");

        updateThread(threadId, thread);

        setDelMessage(false);
      },
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const thread = getThread(threadId);

      if (!thread) notFound();

      mutate({
        threadId,
        messageId: message.id,
        messages: thread.messages.length,
      });
    };

    return (
      <>
        <DropdownMenu
          open={open}
          onOpenChange={(open) => {
            if (!open) return void onOpenChange(false);
          }}
        >
          <DropdownMenuTrigger
            id={`message:${message.id}:${slug}`}
            className={cn(
              "cursor-text select-text rounded-lg px-3 py-2 text-left selection:bg-background",
              message.sender.slug !== slug ? "bg-secondary" : "bg-primary",
            )}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenChange(true);
            }}
          >
            {message.content}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="start">
            <DropdownMenuItem
              onClick={() => {
                setMessage(message);

                setTimeout(() => {
                  scroll();
                }, 0);
              }}
            >
              <Reply className="size-4" />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDelMessage(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={delMessage} onOpenChange={setDelMessage}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Message</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this message? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <form onSubmit={handleSubmit}>
                <SubmitButton isPending={isPending} variant="destructive">
                  Delete Message
                </SubmitButton>
              </form>
              <Button onClick={() => setDelMessage(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

type ReplyActions = {
  setMessage: (message: Nullable<Message>) => void;
};

type ReplyStore = { message: Nullable<Message> } & ReplyActions;

function createReplyStore() {
  return createStore<ReplyStore>((set) => ({
    message: null,
    setMessage: (message) => set({ message }),
  }));
}

type MessageStoreAPI = ReturnType<typeof createReplyStore>;

const ReplyStoreContext = createContext<MessageStoreAPI | null>(null);

export const ReplyMessageProvider = ({ children }: PropsWithChildren) => {
  const store = useRef<MessageStoreAPI | null>(null);

  if (!store.current) store.current = createReplyStore();

  return (
    <ReplyStoreContext.Provider value={store.current}>
      {children}
    </ReplyStoreContext.Provider>
  );
};

export function useReplyStore(): ReplyStore;
export function useReplyStore<T>(selector: (state: ReplyStore) => T): T;
export function useReplyStore(selector?: (state: ReplyStore) => any) {
  const context = useContext(ReplyStoreContext);

  if (!context)
    throw new Error("You can only use this store when inside of a context");

  return useStore(context, selector ?? ((state) => state));
}

function useWebsocketListener(threadId: string) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { ws } = useWebsocketStore();
  const { getThread, updateThread } = useThreadStore();

  useEffect(() => {
    if (!ws) return;

    const thread = getThread(threadId);

    if (!thread) return notFound();

    ws.send(
      JSON.stringify({
        type: "read_thread",
        data: { threadId },
      }),
    );

    updateThread(thread.id, {
      ...thread,
      unread: false,
    });
  }, [ws, router]);

  return null;
}
