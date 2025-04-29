import Elysia from "elysia";

export const api = new Elysia({ name: "API", prefix: "/api" }).get(
  "/status",
  () => ({ status: "ok" })
);

api.routes.forEach((route) => console.info(route.method, route.path));

console.log();
