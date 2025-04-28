"use client";

import type { PropsWithChildren } from "react";
import type { Conversation } from "~/lib/types/conversation";

import { useCallback, useState } from "react";

import { ConversationCard } from "./conversation-card";
import { ScrollingContainer } from "./scrolling-container";
import { SearchConversations } from "./search-conversations";

export const ConversationList = ({
  conversations,
}: {
  conversations: Conversation[];
}) => {
  const [showConversations, setConversations] = useState(true);

  const show = useCallback(() => setConversations(true), []);
  const hide = useCallback(() => setConversations(false), []);

  return (
    <ConversationListShell>
      <div className="flex items-center gap-2 py-3 pb-1">
        <SearchConversations
          show={show}
          hide={hide}
          active={!showConversations}
        />
      </div>
      {showConversations && (
        <ScrollingContainer>
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </ScrollingContainer>
      )}
    </ConversationListShell>
  );
};

const ConversationListShell = ({ children }: PropsWithChildren) => (
  <div className="bg-background flex h-full w-80 shrink-0 flex-col gap-2 overflow-hidden rounded-md p-2">
    {children}
  </div>
);
