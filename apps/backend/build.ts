import { build } from "bun";

await build({
  entrypoints: ["./src/server.ts"],
  outdir: "./dist",
  minify: true,
  target: "bun",
});
