import { Message } from "./messages";
import { SENT_MESSAGE } from "@hireup/common";

type ReceiveMessage = {
  type: typeof SENT_MESSAGE;
  data: Message & { conversationId: string };
};

export type Event = ReceiveMessage;
