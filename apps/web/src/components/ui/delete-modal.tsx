"use client";

import { TriangleAlert, X } from "lucide-react";
import { z } from "zod";

import { ReactNode, useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import { useIsMobile } from "~/lib/hooks/use-mobile";
import { useMutation } from "~/lib/hooks/use-mutation";
import { useToggle } from "~/lib/hooks/use-toggle";
import { cn } from "~/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "./alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { SubmitButton } from "./submit-button";
import { zodResolver } from "@hookform/resolvers/zod";

type Props<T> = {
  title: string;
  confirm: string;
  itemTitle: string;
  description: string;
  action: () => Promise<T>;

  trigger?: ReactNode;
  defaultOpen?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export const DeleteModal = <T,>({
  title,
  trigger,
  confirm,
  itemTitle,
  description,
  defaultOpen,
  action,
}: Props<T>) => {
  const isMobile = useIsMobile();
  const [open, toggle] = useToggle(defaultOpen ?? false);

  const close = useCallback(() => toggle(false), []);

  if (isMobile)
    return (
      <Drawer open={open} onOpenChange={toggle}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className="py-8">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertDescription>
                Warning: This action is not reversible.
              </AlertDescription>
            </Alert>
          </DrawerHeader>
          <DeleteForm
            title={itemTitle}
            confirm={confirm}
            cancel={close}
            action={action}
          />
          <CloseButton close={close} />
        </DrawerContent>
      </Drawer>
    );

  return (
    <AlertDialog open={open} onOpenChange={toggle}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <Alert variant="destructive">
            <TriangleAlert className="size-8" />
            <AlertDescription>
              Warning: This action is not reversible.
            </AlertDescription>
          </Alert>
        </AlertDialogHeader>
        <DeleteForm
          title={itemTitle}
          confirm={confirm}
          cancel={close}
          action={action}
        />
        <CloseButton close={close} />
      </AlertDialogContent>
    </AlertDialog>
  );
};

type DeleteFormProps<T> = {
  title: string;
  confirm: string;
  cancel: () => void;
  action: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

const DeleteForm = <T,>({
  title,
  confirm,
  cancel,
  action,
  onError,
  onSuccess,
}: DeleteFormProps<T>) => {
  const DeleteFormSchema = z.object({
    title: z
      .string()
      .min(title.length, { message: `Must match ${title}` })
      .max(title.length, { message: `Must match ${title}` }),
    confirm: z
      .string()
      .min(confirm.length, { message: `Must match ${confirm}` })
      .max(confirm.length, { message: `Must match ${confirm}` }),
  });

  type DeleteFormSchema = z.infer<typeof DeleteFormSchema>;

  const form = useForm<DeleteFormSchema>({
    resolver: zodResolver(DeleteFormSchema),
    defaultValues: {
      title: "",
      confirm: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: action,
    onError: onError,
    onSuccess: onSuccess,
  });

  const handleSubmit = () => {
    mutate({});
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground data-[error=true]:text-muted-foreground gap-1">
                Enter <span className="text-foreground">{title}</span> to
                continue:
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    form.getFieldState(field.name).error &&
                      "border-destructive focus:border-border",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="confirm"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground data-[error=true]:text-muted-foreground gap-1">
                To verify, type
                <span className="text-foreground">{confirm}</span> below:
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    form.getFieldState(field.name).error &&
                      "border-destructive focus:border-border",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full flex-row-reverse items-center gap-2">
          <SubmitButton isPending={isPending}>Delete</SubmitButton>
          <Button type="button" variant="outline" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

const CloseButton = ({ close }: { close: () => void }) => {
  return (
    <Button
      type="button"
      onClick={close}
      className="ring-offset-background bg-background hover:bg-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 size-6 rounded-md transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
    >
      <X className="size-4" />
      <span className="sr-only">Close Delete Modal</span>
    </Button>
  );
};
