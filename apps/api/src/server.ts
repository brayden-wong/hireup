import { cors } from "@elysiajs/cors";
import { api } from "./api";
import { auth } from "./api/auth";
import * as dotenv from "dotenv";
import { users } from "./api/users";
import { conversations } from "./api/conversations";
import { featureFlags } from "./api/feature-flags";
import { main } from "seed";
import { jobs } from "./api/jobs";
import { websocket } from "./api/websocket";

dotenv.config();

const { env } = await import("./env");

await main();

api
  .use(
    cors({
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      origin: ["http://localhost:3000", "http://localhost:3001", env.CLIENT],
    })
  )
  .use(auth)
  .use(featureFlags)
  .use(jobs)
  .use(users)
  .use(conversations)
  .use(websocket)
  .listen(env.PORT);

api.routes.forEach((route) => console.info(route.method, route.path));
