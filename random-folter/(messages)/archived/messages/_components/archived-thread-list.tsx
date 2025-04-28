import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AuthRedirect } from "~/components/redirect";
import { Button } from "~/components/ui/button";
import { TypedError } from "~/lib/data/error";
import { getArchivedThreads } from "~/server/data/archived-threads";
import { ScrollingContainer } from "~/app/(main)/(messages)/_components/scrolling-container";
import { ArchivedThreadCard } from "./archived-thread-card";

export const ArchivedThreadList = async () => {
  const threads = await getArchivedThreads();

  if (threads instanceof TypedError || !threads)
    return <AuthRedirect redirect />;

  return (
    <>
      <div className="flex h-full w-80 shrink-0 flex-col rounded-md bg-background p-2">
        <Link href="/messages" className="w-fit">
          <Button variant="ghost">
            <ArrowLeft className="size-4" /> Messages
          </Button>
        </Link>
        <ScrollingContainer className="p-0 pt-2">
          {threads.map((thread) => (
            <ArchivedThreadCard key={thread.id} thread={thread} />
          ))}
        </ScrollingContainer>
      </div>
    </>
  );
};
