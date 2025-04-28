import { Nullable } from "./nullable";

export type Reply = {
  id: number;
  content: string;
  createdAt: Date;
  deleted: boolean;
};

export type Message = {
  id: number;
  read: boolean;
  content: string;
  deleted: boolean;
  createdAt: Date;
  reply: Nullable<Reply>;
  sender: {
    id: number;
    slug: string;
    firstName: string;
    lastName: string;
  };
};
