import { getThread } from "~/server/data/threads";
import { Thread } from "./_components/thread";
import { AuthRedirect } from "~/components/redirect";
import { env } from "~/env";
import { UpdateThread } from "./_components/update-thread";
import { ArchivedThread } from "./_components/archived-thread";

const MessageThread = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const thread = await getThread(id);

  if (thread instanceof Error) return <AuthRedirect redirect />;

  if (thread.archived)
    return <ArchivedThread url={env.API_URL} thread={thread} />;

  return (
    <UpdateThread thread={thread}>
      <Thread id={id} url={env.API_URL} />
    </UpdateThread>
  );
};

export default MessageThread;
