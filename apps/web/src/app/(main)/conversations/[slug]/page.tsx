import { notFound } from "next/navigation";

import { getConversation } from "~/server/data/cache/conversations";

import { AuthRedirect } from "~/components/redirect";
import { Conversation } from "~/features/conversations/components/conversation";

const ConversationPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  const data = await getConversation(slug);

  if (
    !data ||
    (typeof data === "string" && data !== "Conversation does not exist")
  )
    return <AuthRedirect redirect />;

  if (data === "Conversation does not exist") return notFound();

  return <Conversation data={data} />;
};

export default ConversationPage;
