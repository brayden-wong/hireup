import React from "react";

import { NewConversation } from "~/features/conversations/components/new-conversation";
import { NewMessage } from "~/features/conversations/components/new-message";

const ConversationsPage = () => {
  return (
    <main className="bg-background flex h-full w-full flex-col rounded-md p-2">
      <NewMessage />
      <div className="flex-1" />
      <NewConversation />
    </main>
  );
};

export default ConversationsPage;
