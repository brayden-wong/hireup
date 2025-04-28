import { User } from "../stores/auth-store";
import { Message, Thread } from "./thread";

type Success<T> = { success: true; data: T };
type Err<T extends string> = { success: false; error: T };
type Response<T, E extends string> = Success<T> | Err<E>;

export type CreateRoomMessage = Response<
  {
    type: "created_thread";
    thread: Thread;
  },
  "User could not be found"
>;

export type ReceiveMessage = Response<
  {
    type: "receive_message";
    thread: Omit<Thread, "messages"> & { message: Message };
  },
  "User could not be found"
>;

export type WebsocketMessage = Stringified<CreateRoomMessage | ReceiveMessage>;
