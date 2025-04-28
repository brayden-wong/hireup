import { Send, X } from "lucide-react";
import { toast } from "sonner";
import type { SendMessage } from "~/lib/schemas/send-message-schema";
import type { Message } from "~/lib/types/messages";

import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { createMessage } from "~/server/mutations/messages";

import { useMutation } from "~/lib/hooks/use-mutation";
import { useRevalidate } from "~/lib/hooks/use-revalidate";
import { SendMessageSchema } from "~/lib/schemas/send-message-schema";
import { useSession } from "~/lib/stores/auth-store";
import { cn } from "~/lib/utils";

import { useReplyStore } from "./conversation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { SubmitButton } from "~/components/ui/submit-button";
import { Textarea } from "~/components/ui/textarea";
import { CONVERSATION, CONVERSATIONS } from "~/constants/revalidate";

type Props = {
  name: string;
  participantId: number;
  conversationId: number;
  addMessage: (message: Message) => void;
};

export const SendMessageForm = ({
  name,
  addMessage,
  participantId,
  conversationId,
}: Props) => {
  const sessionId = useSession();
  const { message, setMessage } = useReplyStore();

  const { revalidate, invalidate } = useRevalidate();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const removeReply = useCallback(() => {
    setMessage(null);
  }, []);

  const form = useForm<SendMessage>({
    resolver: zodResolver(SendMessageSchema),
    defaultValues: {
      content: "",
      conversationId,
      userId: participantId,
      replyId: null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createMessage,
    onError: (error) => toast(error.message),
    onSuccess: async (data) => {
      console.log(data);
      await revalidate({
        tags: [`${CONVERSATIONS}:${sessionId}`],
      });

      invalidate({ tags: [CONVERSATION] });

      addMessage(data);
    },
  });

  const handleSubmit = (data: SendMessage) => {
    mutate(data);

    form.reset({
      content: "",
      replyId: null,
      conversationId,
      userId: participantId,
    });

    removeReply();
  };

  useEffect(() => {
    if (!message) return;

    form.setValue("replyId", message.id);
    textareaRef.current?.focus();
  }, [message]);

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
            <FormItem
              className={cn(
                "focus-within:ring-primary flex-1 focus-within:rounded-md focus-within:ring-2 focus-within:ring-offset-2",
              )}
            >
              <div className="rounded-m flex flex-col">
                {message && (
                  <div className="bg-muted text-muted-foreground flex items-center justify-between rounded-t-md px-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">Replying to:</span>
                      <p className="line-clamp-1 max-w-[95%]">
                        {message?.content}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      onClick={removeReply}
                      className="bg-transparent hover:bg-transparent focus-visible:ring-offset-0"
                    >
                      <X className="text-primary size-4" />
                    </Button>
                  </div>
                )}
                <FormControl>
                  <Textarea
                    {...field}
                    rows={1}
                    autoFocus
                    ref={textareaRef}
                    className={cn(
                      "focus-visible:border-border max-h-32 min-h-[2.5rem] resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                      message && "rounded-t-none rounded-b-md",
                    )}
                    placeholder={`Message ${name}`}
                    onKeyDown={(e) => {
                      if (isPending) return void e.preventDefault();

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
        <SubmitButton
          size="icon"
          isPending={isPending}
          className="min-w-fit focus-visible:ring-offset-2"
        >
          {isPending ? (
            <LoadingSpinner className="text-primary-foreground size-4" />
          ) : (
            <Send className="mr-1.5 mb-0.5 size-5 rotate-45" />
          )}
        </SubmitButton>
      </form>
    </Form>
  );
};
