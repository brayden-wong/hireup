"use client";

import { Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { createConversation } from "~/server/mutations/conversations";

import { useMutation } from "~/lib/hooks/use-mutation";
import { useCreateMessageStore } from "~/lib/stores/create-message-store";

import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { SubmitButton } from "~/components/ui/submit-button";
import { Textarea } from "~/components/ui/textarea";

const NewConversationSchema = z.object({
  userId: z.number(),
  content: z.string().min(1),
});

type NewConversation = z.infer<typeof NewConversationSchema>;

export const NewConversation = () => {
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useCreateMessageStore((state) => state.message);
  const form = useForm<NewConversation>({
    defaultValues: {
      userId: user?.id ?? -1,
      content: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createConversation,
    onError: (err) => toast(err.message),
    onSuccess: (conversation) => {
      router.push(`/conversations/${conversation.slug}`);
    },
  });

  const handleSubmit = (data: NewConversation) => mutate(data);

  useEffect(() => {
    if (user?.id) form.setValue("userId", user.id);
  }, [user?.id]);

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
                  disabled={!user}
                  ref={textareaRef}
                  className="max-h-32 min-h-10 resize-none"
                  placeholder={
                    !user
                      ? "Add a recipient to start a new conversation"
                      : `Message ${user.firstName} ${user.lastName}`
                  }
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
        <SubmitButton
          size="icon"
          disabled={!user || isPending}
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
