import type { CONVERSATION_PERMISSIONS } from "../permissions";

import { User } from "../stores/auth-store";
import { Message } from "./messages";

export type CONVERSATION_PERMISSIONS =
  (typeof CONVERSATION_PERMISSIONS)[number];

export type Conversation = {
  id: number;
  slug: string;
  read: boolean;
  lastActive: Date;
  messages: Message[];
  permission: CONVERSATION_PERMISSIONS;
  participant: {
    user: User;
    userId: number;
    permission: CONVERSATION_PERMISSIONS;
  };
};
