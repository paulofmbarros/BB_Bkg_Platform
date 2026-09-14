import { existsSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const debug = process.argv.includes("--debug");

if (!existsSync(".env.local")) {
  throw new Error("Local setup is missing. Run npm run setup:local first.");
}

const contents = readFileSync(".env.local", "utf8");
const url = contents.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1];
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
  throw new Error("Refusing to start demo services with a non-local database.");
}

const database = spawnSync(npm, ["run", "db:start"], { stdio: "inherit" });
if (database.status !== 0) process.exit(database.status ?? 1);

if (!existsSync("supabase/functions/.env")) {
  throw new Error(
    "Invitation setup is missing. Run npm run setup:local first.",
  );
}

const children = [
  spawn(npx, ["supabase", "functions", "serve"], { stdio: "inherit" }),
  spawn(
    npm,
    ["run", "dev", "--", "--port", "3000", ...(debug ? ["--inspect"] : [])],
    { stdio: "inherit" },
  ),
];
let stopping = false;

function stop(signal, exitCode) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill(signal);
  }
  const force = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  }, 3000);
  force.unref();
  process.exitCode = exitCode;
}

process.on("SIGINT", () => stop("SIGINT", 130));
process.on("SIGTERM", () => stop("SIGTERM", 143));

for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop("SIGTERM", 1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(
        `A local service stopped${signal ? ` from ${signal}` : ` with code ${code}`}.`,
      );
      stop("SIGTERM", code ?? 1);
    }
  });
}

console.log("Local app: http://127.0.0.1:3000");
if (debug) console.log("Next.js server debugger: 127.0.0.1:9229");
console.log("Press Ctrl+C once to stop the app and invitation function.");
