import Elysia, { t } from "elysia";
import { broker } from "~/packages/broker";
import { db, dbFunctions } from "~/packages/db";
import superjson from "superjson";
import { json } from "~/packages/json";

export const websocket = new Elysia({ name: "Websocket", prefix: "/ws" }).use(
  dbFunctions
);

websocket
  .derive(async ({ query, db_functions }) => {
    const sessionId = query.sessionId;

    if (!sessionId)
      return { runtime_error: "No session provided", session: null };

    const session = await db_functions.getSession(sessionId);

    if (!session) return { runtime_error: "Session not found", session: null };

    return { session, runtime_error: null };
  })
  .use(db)
  .use(json)
  .use(broker)
  .ws("/", {
    open: async (ws) => {
      const error = ws.data.runtime_error;
      const session = ws.data.session;

      if (ws.data.runtime_error) {
        ws.send(superjson.stringify({ success: false, error }));

        return void ws.close();
      }

      ws.data.broker.subscribe(session!.slug, (channel, message) => {
        if (channel !== session!.slug) return;

        ws.send(JSON.parse(message));
      });

      console.log(ws.id, "connected");

      ws.send(
        ws.data.json.stringify({ success: true, data: { type: "subscribed" } })
      );
    },
    close: (ws) => {
      const session = ws.data.session;

      if (session) {
        console.log("unsubscribing", session.slug);
        ws.data.broker.unsubscribe(session.slug);
      }

      console.log(ws.id, "disconnected");
    },
    query: t.Object({
      sessionId: t.Optional(t.String()),
    }),
  });
