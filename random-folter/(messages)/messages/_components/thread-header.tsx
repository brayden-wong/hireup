"use client";

import { X } from "lucide-react";
import { useCallback } from "react";
import { useCreateMessageStore } from "~/lib/stores/create-message-store";

export const ThreadHeader = () => {
  const { message, setMessage } = useCreateMessageStore();

  const removeMessage = useCallback(() => setMessage(null), []);

  return (
    !!message && (
      <div className="inline-flex h-10 w-fit items-center justify-center gap-4 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
        {message.name}
        <button
          onClick={removeMessage}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Cancel Message</span>
        </button>
      </div>
    )
  );
};
