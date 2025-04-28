import { User } from "../stores/auth-store";
import { Message } from "./messages";

export type Thread = {
  id: string;
  creator: User;
  user: User;
  unread: boolean;
  lastActive: Date;
  messages: Message[];
};
