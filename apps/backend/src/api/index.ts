import Elysia from "elysia";
import { json } from "~/packages/json";

export const api = new Elysia({
  name: "API",
  prefix: "/api",
})
  .use(json)
  .get("/status", async ({ json }) =>
    json.stringify({ status: "ok", now: new Date() })
  );
