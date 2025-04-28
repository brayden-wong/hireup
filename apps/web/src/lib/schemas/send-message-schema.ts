import { z } from "zod";

export const SendMessageSchema = z.object({
  conversationId: z.number(),
  content: z.string().min(1),
  userId: z.number(),
  replyId: z.number().nullable(),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;
