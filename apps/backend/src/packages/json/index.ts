import Elysia from "elysia";
import superjson from "superjson";

export const json = new Elysia({ name: "super json" }).decorate(
  "json",
  superjson
);
