"use client";

import { formatRelative } from "date-fns";
import { Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import superjson from "superjson";
import { createStore, useStore } from "zustand";
import type { RefObject } from "react";
import type { Conversation as ConversationType } from "~/lib/types/conversation";

import {
  createContext,
  FormEvent,
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { useParams, useRouter } from "next/navigation";

import { deleteMessage } from "~/server/mutations/messages";

import { TypedError } from "~/lib/data/error";
import { useMutation } from "~/lib/hooks/use-mutation";
import { useRevalidate } from "~/lib/hooks/use-revalidate";
import { useSession, useUser } from "~/lib/stores/auth-store";
import { useWebsocketStore } from "~/lib/stores/websocket-store";
import { Event } from "~/lib/types/events";
import { Message as MessageType } from "~/lib/types/messages";
import { Nullable } from "~/lib/types/nullable";
import { clientRequest, cn, formatName, request } from "~/lib/utils";

import { useNameStore } from "../store/header-store";
import { SendMessageForm } from "./send-message";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ReadConversationResponse } from "~/app/api/[conversation]/read-conversation/route";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { SubmitButton } from "~/components/ui/submit-button";
import { CONVERSATIONS } from "~/constants/revalidate";

type Props = {
  data: { conversation: ConversationType; next: Nullable<number> };
};

export const Conversation = ({ data }: Props) => {
  const user = useUser();
  const router = useRouter();
  const sessionId = useSession();
  const [messages, setMessages] = useState(() => data.conversation.messages);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { revalidate } = useRevalidate();
  const setHeader = useNameStore((state) => state.setHeader);

  const name = formatName(
    data.conversation.participant.user.firstName,
    data.conversation.participant.user.lastName,
  );

  const { ws } = useWebsocketStore();

  const scroll = useCallback(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const addPreviousMessages = useCallback(
    (messages: MessageType[]) => {
      setMessages((prev) => [...messages, ...prev]);
    },
    [messages],
  );

  const addMessage = useCallback(
    (message: MessageType) => {
      setMessages((messages) => [...messages, message]);

      new Promise(() =>
        setTimeout(() => {
          scroll();
        }, 0),
      );
    },
    [messages],
  );

  useEffect(() => {
    setHeader({
      name,
      href: `/conversations/${data.conversation.slug}`,
    });

    if (
      messages.length > 0 &&
      messages.some((message) => !message.read && message.sender.id !== user.id)
    ) {
      (async () => {
        const response = await request<ReadConversationResponse>(
          `/api/${data.conversation.slug}/read-conversation`,
          {
            method: "POST",
            superjson: false,
            session: sessionId,
          },
        );

        if (!response.success) return;

        router.refresh();
      })();
    }
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = async ({ data }: MessageEvent<string>) => {
      const payload = superjson.parse<Event>(data);

      if (payload.type === "sent_message") {
        await revalidate({ tags: [`${CONVERSATIONS}:${sessionId}`] });

        setMessages((messages) => [...messages, payload.data]);

        await new Promise(() =>
          setTimeout(() => {
            scroll();
          }, 0),
        );
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws]);

  return (
    <ReplyMessageProvider>
      <main className="bg-background flex flex-1 flex-col gap-2 rounded-md p-2">
        <Messages
          next={data.next}
          messages={messages}
          scrollRef={scrollRef}
          addMessages={addPreviousMessages}
        />
        <SendMessageForm
          name={name}
          addMessage={addMessage}
          conversationId={data.conversation.id}
          participantId={data.conversation.participant.userId}
        />
      </main>
    </ReplyMessageProvider>
  );
};

type MessageProps = {
  messages: MessageType[];
  next: Nullable<number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  addMessages: (messages: MessageType[]) => void;
};

const Messages = ({ next, messages, scrollRef, addMessages }: MessageProps) => {
  const { slug } = useParams<{ slug: string }>();

  const [canFetch, setCanFetch] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView({
    root: containerRef.current,
  });

  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["messages", slug],
    queryFn: ({ pageParam }) =>
      getMessages({ page: pageParam, conversationId: slug }),
    initialData: {
      pages: [{ messages: messages, next: next ?? undefined }],
      pageParams: [next ?? 1],
    },
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    initialPageParam: 0,
  });

  const pageData = useMemo(() => {
    if (data.pages.length === 1)
      return {
        page: data.pages.at(-1)!,
        firstPage: true,
      };

    return {
      page: data.pages[data.pages.length - 1]!,
      firstPage: false,
    };
  }, [data.pages.length]);

  useLayoutEffect(() => {
    const scrollToBottom = () => {
      const end = document.getElementById("bottom");

      if (!end) return scrollToBottom();

      const observer = new ResizeObserver(() => {
        end.scrollIntoView({ behavior: "instant" });

        setCanFetch(true);
        setScrollable(true);
        observer.disconnect();
      });

      observer.observe(end.parentElement!);

      return () => {
        observer.disconnect();
      };
    };

    scrollToBottom();
  }, []);

  useEffect(() => {
    if (pageData.firstPage) return;

    console.log("messages", pageData.page.messages);
    if (containerRef.current) {
      const scrollContainer = containerRef.current;
      const prevHeight = scrollContainer.scrollHeight;
      const prevScrollTop = scrollContainer.scrollTop;

      addMessages(pageData.page.messages);

      setTimeout(() => {
        const newHeight = scrollContainer.scrollHeight;
        const heightDifference = newHeight - prevHeight;

        scrollContainer.scrollTo({
          top: prevScrollTop + heightDifference,
          behavior: "auto",
        });
      }, 0);
    }
  }, [pageData]);

  useEffect(() => {
    if (inView && canFetch && pageData.page?.next && !isFetchingNextPage) {
      fetchNextPage();
      setCanFetch(false);

      setTimeout(() => {
        setCanFetch(true);
      }, 250);
    }
  }, [inView, canFetch, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 flex-col gap-2 overflow-y-auto pr-2",
        scrollable ? "opacity-100" : "opacity-0",
      )}
    >
      <div id="top" ref={ref} />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      {messages.map((message, index) => (
        <Message
          key={`${message.id}:${index}`}
          message={message}
          scrollRef={scrollRef}
          prevMessage={messages[index - 1]}
        />
      ))}
      <div id="bottom" ref={scrollRef} />
    </div>
  );
};

const Message = ({
  message,
  prevMessage,
  scrollRef,
}: {
  message: MessageType;
  prevMessage?: MessageType;
  scrollRef: RefObject<HTMLDivElement | null>;
}) => {
  const { slug } = useParams<{ slug: string }>();
  const user = useUser();

  const scroll = useCallback(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const scrollToMessage = useCallback((id: `message:${number}`) => {
    const element = document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const shouldShowTimestamp = useCallback(
    (currentMsg: MessageType, prevMsg?: MessageType) => {
      if (!prevMsg) return true;

      const currentTime = new Date(currentMsg.createdAt);
      const prevTime = new Date(prevMsg.createdAt);
      const diffInMinutes =
        (currentTime.getTime() - prevTime.getTime()) / (1000 * 60);

      return diffInMinutes >= 10;
    },
    [message],
  );

  const formatMessageTime = useCallback(
    (date: Date) => formatRelative(date, new Date()),
    [message],
  );

  return (
    <div className="flex flex-col gap-1">
      {shouldShowTimestamp(message, prevMessage) && (
        <div className="flex justify-center">
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex w-full",
          message.sender.id === user.id ? "justify-end" : "justify-start",
        )}
      >
        <div className="flex max-w-[70%] items-center gap-2">
          <div className="flex w-full flex-col gap-1">
            {message.reply && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() =>
                    scrollToMessage(`message:${message.reply!.id}`)
                  }
                  className="border-primary/80 text-primary/80 max-w-72 rounded-md border px-2 py-1 text-left text-xs"
                >
                  <p className="line-clamp-3">{message.reply.content}</p>
                </button>
                <div
                  className={cn(
                    "right-0 flex h-4",
                    message.sender.id === user.id
                      ? "justify-end pl-[1px]"
                      : "justify-start pr-[1px]",
                  )}
                >
                  <div className="bg-primary h-full w-[2px] rounded-full opacity-40" />
                </div>
              </div>
            )}
            <div
              className={cn(
                "group flex gap-2",
                message.sender.id === user.id ? "justify-end" : "justify-start",
              )}
            >
              {message.sender.id === user.id && !message.deleted && (
                <ReplyButton scroll={scroll} message={message} />
              )}
              {message.sender.id === user.id ? (
                !!message.deleted ? (
                  <span className="text-muted-foreground text-sm">
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
                <span className="text-muted-foreground text-sm">
                  message deleted
                </span>
              ) : (
                <span
                  id={`message:${message.id}`}
                  className={cn(
                    "rounded-lg px-3 py-2",
                    message.sender.id === user.id
                      ? "bg-primary"
                      : "bg-secondary",
                  )}
                >
                  {message.content}
                </span>
              )}
              {message.sender.id !== user.id && !message.deleted && (
                <ReplyButton scroll={scroll} message={message} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReplyButton = memo(
  ({ message, scroll }: { message: MessageType; scroll: () => void }) => {
    const { setMessage } = useReplyStore();

    const reply = useCallback(() => {
      setMessage(message);

      setTimeout(() => {
        scroll();
      }, 0);
    }, [message]);

    return (
      <button
        className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
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
    message: MessageType;
    scroll: () => void;
  }) => {
    const [open, onOpenChange] = useState(false);
    const [delMessage, setDelMessage] = useState(false);
    const { slug: conversationId } = useParams<{ slug: string }>();
    const user = useUser();

    const { setMessage } = useReplyStore();

    const { mutate, isPending } = useMutation({
      mutationFn: deleteMessage,
      onError: (err) => toast(err.message),
      onSuccess: (thread) => {
        toast("Message deleted");

        // updateConversation(conversationId, thread);

        setDelMessage(false);
      },
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      mutate({
        threadId: conversationId,
        messageId: message.id,
        messages: 5,
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
            id={`message:${message.id}`}
            className={cn(
              "selection:bg-background cursor-text rounded-lg px-3 py-2 text-left select-text",
              message.sender.id !== user.id ? "bg-secondary" : "bg-primary/60",
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
  setMessage: (message: Nullable<MessageType>) => void;
};

type ReplyStore = { message: Nullable<MessageType> } & ReplyActions;

function createReplyStore() {
  return createStore<ReplyStore>((set) => ({
    message: null,
    setMessage: (message) => set({ message }),
  }));
}

type MessageStoreAPI = ReturnType<typeof createReplyStore>;

const ReplyStoreContext = createContext<MessageStoreAPI | null>(null);

const ReplyMessageProvider = ({ children }: PropsWithChildren) => {
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

type GetMessagesParams = {
  page: number;
  conversationId: string;
};

type Success = {
  success: true;
  data: {
    messages: MessageType[];
    next: number | undefined;
  };
};

type Error = {
  success: false;
  error: string;
};

async function getMessages({ page, conversationId }: GetMessagesParams) {
  const response = await clientRequest<Success | Error>(
    `/api/${conversationId}/get-more-messages?page=${page}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.success) throw new TypedError(response.error);

  return response.data;
}
