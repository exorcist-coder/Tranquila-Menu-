import { spawnSync } from "node:child_process";
const branch = process.argv[2];
if (!["tranquila", "tranquila-nest"].includes(branch)) throw new Error("Choose tranquila or tranquila-nest.");
const main = "https://tranquila-main-test.tranquila-hotels.workers.dev";
const nest = "https://tranquila-nest-test.tranquila-hotels.workers.dev";
// Set every public branch URL before Next.js inlines NEXT_PUBLIC_* values.
const env = {
  ...process.env,
  CLOUDFLARE_TEST_READ_ONLY: "1",
  NEXT_PUBLIC_HOTEL_BRANCH_ID: branch,
  NEXT_PUBLIC_MAIN_HOTEL_URL: main,
  NEXT_PUBLIC_NEST_HOTEL_URL: nest,
  NEXT_PUBLIC_HOTEL_SELECTOR_URL: main,
  NEXT_PUBLIC_SITE_URL: branch === "tranquila" ? main : nest,
};
const args = ["opennextjs-cloudflare", "build", ...(branch === "tranquila-nest" ? ["--env", "nest"] : [])];
const result = spawnSync("npx", args, { env, stdio: "inherit" });
process.exit(result.status ?? 1);
