import Elysia from "elysia";
import Redis from "ioredis";
import { env } from "~/env";

import superjson from "superjson";

class Broker {
  private publisher: Redis;
  private subscriber: Redis;

  constructor(url: string) {
    this.publisher = new Redis(url);
    this.subscriber = new Redis(url);
  }

  publish<T>(channel: string, message: T): void {
    return void this.publisher.publish(channel, superjson.stringify(message));
  }

  subscribe<T>(
    channel: string,
    callback: (channel: string, message: Stringified<T>) => void
  ): void {
    this.subscriber.subscribe(channel);

    this.subscriber.on(
      "message",
      (channel: string, message: Stringified<T>) => {
        callback(channel, message);
      }
    );
  }

  unsubscribe(channel: string): void {
    this.subscriber.unsubscribe(channel);
  }
}

export const broker = new Elysia({ name: "Broker" }).decorate(
  "broker",
  new Broker(env.REDIS_URL)
);
