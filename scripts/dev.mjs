import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import {
  ensureLocalPostgres,
  isLocalEmbeddedTarget,
  readDatabaseUrlFromEnv
} from "./local-db.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const databaseUrl = readDatabaseUrlFromEnv();
let pg = null;

if (isLocalEmbeddedTarget(databaseUrl)) {
  pg = await ensureLocalPostgres();
}

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

let shuttingDown = false;
async function shutdown(signalOrCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (typeof signalOrCode === "string" && !child.killed) {
    child.kill(signalOrCode);
  }
  if (pg) {
    await pg.stop().catch(() => undefined);
  }

  process.exit(typeof signalOrCode === "number" ? signalOrCode : 0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

child.on("exit", (code) => {
  void shutdown(code ?? 0);
});
