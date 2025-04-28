import type { PropsWithChildren } from "react";

import { getConversations } from "~/server/data/cache/conversations";

import {
  Container,
  ContainerContent,
  ContainerHeader,
} from "~/components/layouts/container";
import { AuthRedirect } from "~/components/redirect";
import { ConversationList } from "~/features/conversations/components/conversation-list";
import { NameHeader } from "~/features/conversations/components/name-header";
import { HeaderProvider } from "~/features/conversations/context/header-context";
import { QueryClientProvider } from "~/features/conversations/context/query-context";

export const revalidate = 60;

const ConversationLayout = async ({ children }: PropsWithChildren) => {
  const conversations = await getConversations();

  if (!conversations || typeof conversations === "string")
    return <AuthRedirect redirect />;

  return (
    <Container className="py-2 pr-2">
      <HeaderProvider>
        <ContainerHeader>
          <NameHeader />
        </ContainerHeader>
        <QueryClientProvider>
          <ContainerContent className="bg-accent/80 p-2">
            <ConversationList conversations={conversations} />
            {children}
          </ContainerContent>
        </QueryClientProvider>
      </HeaderProvider>
    </Container>
  );
};

export default ConversationLayout;
