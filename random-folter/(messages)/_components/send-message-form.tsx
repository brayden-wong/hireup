"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { Textarea } from "~/components/ui/textarea";
import { useCreateMessageStore } from "~/lib/stores/create-message-store";
import { useAuthStore } from "~/lib/stores/user-store";
import { useWebsocketStore } from "~/lib/stores/websocket-store";
import { useReplyStore } from "../messages/[id]/_components/thread";
import { Button } from "~/components/ui/button";

const NewThreadSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1),
});

const SendMessageSchema = z.object({
  threadId: z.string().min(1),
  content: z.string().min(1),
  userId: z.string().min(1),
  replyId: z.number().nullable(),
});

export const NewThreadForm = () => {
  const message = useCreateMessageStore((state) => state.message);

  const form = useForm<z.infer<typeof NewThreadSchema>>({
    defaultValues: { userId: message?.id, content: "" },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ws = useWebsocketStore((state) => state.ws);

  const handleSubmit = (data: z.infer<typeof NewThreadSchema>) => {
    if (!ws) return;

    ws.send(
      JSON.stringify({
        type: "create_thread",
        data: {
          userId: data.userId,
          content: data.content,
        },
      }),
    );
  };

  useEffect(() => {
    if (message?.id) form.setValue("userId", message.id);
  }, [message?.id]);

  return (
    <Form {...form}>
      <form
        className="flex items-end gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="content"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Textarea
                  {...field}
                  disabled={!message}
                  ref={textareaRef}
                  className="max-h-32 min-h-[2.5rem] resize-none"
                  placeholder={
                    !message
                      ? "Add a recipient to start a new conversation"
                      : `Message ${message.name}`
                  }
                  onChange={(e) => {
                    const text = e.target.value;
                    field.onChange(text);

                    const textarea = textareaRef.current;
                    if (!textarea) return;

                    textarea.style.height = "auto";
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 256)}px`; // 256px = 16rem (max-h-64)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();

                      form.handleSubmit(handleSubmit)();
                    }
                  }}
                  rows={1}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <SubmitButton size="icon" disabled={!message}>
          <Send className="size-5" />
        </SubmitButton>
      </form>
    </Form>
  );
};

export const SendMessageForm = ({
  name,
  thread,
  onFocus,
}: {
  name: string;
  thread: string;
  onFocus: () => void;
}) => {
  const user = useAuthStore((state) => state.user);

  const { message, setMessage } = useReplyStore();

  const removeReply = useCallback(() => {
    setMessage(null);
  }, []);

  const form = useForm<z.infer<typeof SendMessageSchema>>({
    defaultValues: {
      threadId: thread,
      content: "",
      userId: user?.slug ?? "",
    },
    resolver: zodResolver(SendMessageSchema),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ws = useWebsocketStore((state) => state.ws);

  const handleSubmit = (data: z.infer<typeof SendMessageSchema>) => {
    if (!ws) return;

    ws.send(
      JSON.stringify({
        type: "message",
        data: {
          slug: data.threadId,
          content: data.content,
          replyId: data.replyId,
        },
      }),
    );

    form.reset({
      content: "",
      replyId: null,
      userId: user?.slug,
      threadId: thread,
    });

    setMessage(null);

    setTimeout(onFocus, 100);
  };

  useEffect(() => {
    if (message) {
      form.setValue("replyId", message.id);
      textareaRef.current?.focus();
    } else form.setValue("replyId", null);
  }, [message]);

  useEffect(() => {
    if (!user) return;

    form.setValue("userId", user.slug);
  }, [user]);

  if (message)
    return (
      <Form {...form}>
        <form
          className="flex items-end gap-2"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            name="content"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <div className="rounded-m flex flex-col">
                  <div className="flex items-center justify-between rounded-t-md bg-muted px-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">Replying to:</span>
                      <p className="line-clamp-1 max-w-[95%]">
                        {message.content}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      onClick={removeReply}
                      className="bg-transparent hover:bg-transparent"
                    >
                      <X className="size-4 text-primary" />
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={1}
                      ref={textareaRef}
                      onFocus={onFocus}
                      className="max-h-32 min-h-[2.5rem] resize-none rounded-b-md rounded-t-none focus-visible:ring-offset-0"
                      placeholder={`Reply to message...`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          form.handleSubmit(handleSubmit)();
                        }
                      }}
                      onChange={(e) => {
                        const text = e.target.value;
                        field.onChange(text);
                        const textarea = textareaRef.current;
                        if (!textarea) return;
                        textarea.style.height = "auto";
                        textarea.style.height = `${Math.min(textarea.scrollHeight, 256)}px`;
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          <SubmitButton size="icon">
            <Send className="size-5" />
          </SubmitButton>
        </form>
      </Form>
    );

  return (
    <Form {...form}>
      <form
        className="flex items-end gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="content"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Textarea
                  {...field}
                  autoFocus
                  rows={1}
                  ref={textareaRef}
                  onFocus={onFocus}
                  className="max-h-32 min-h-[2.5rem] resize-none"
                  placeholder={`Message ${name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();

                      form.handleSubmit(handleSubmit)();
                    }
                  }}
                  onChange={(e) => {
                    const text = e.target.value;
                    field.onChange(text);

                    const textarea = textareaRef.current;
                    if (!textarea) return;

                    textarea.style.height = "auto";
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 256)}px`;
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <SubmitButton size="icon">
          <Send className="size-5" />
        </SubmitButton>
      </form>
    </Form>
  );
};
