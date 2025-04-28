import { notFound } from "next/navigation";
import { AuthRedirect } from "~/components/redirect";
import { getThread } from "~/server/data/threads";
import { env } from "~/env";
import { ArchivedThread } from "./_components/archive-thread";

const ArchivedThreadPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const thread = await getThread(id);

  if (thread instanceof Error) return <AuthRedirect redirect />;

  if (!thread.archived) notFound();

  return <ArchivedThread url={env.API_URL} thread={thread} />;
};

export default ArchivedThreadPage;
