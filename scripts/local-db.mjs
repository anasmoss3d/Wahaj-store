import fs from "node:fs";
import fsp from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

export function readDatabaseUrlFromEnv() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return "";
  }
  const raw = fs.readFileSync(envPath, "utf8");
  const match = raw.match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)["']?/m);
  return match ? match[1].trim() : "";
}

export function isLocalEmbeddedTarget(databaseUrl) {
  if (!databaseUrl) return true;
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port || "5432";
    return (host === "localhost" || host === "127.0.0.1" || host === "::1") && port === "5432";
  } catch {
    return false;
  }
}

export function isPortOpen(port = 5432, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function cleanupStalePidFile(databaseDir) {
  const pidPath = path.join(databaseDir, "postmaster.pid");
  if (!fs.existsSync(pidPath)) return;

  try {
    const content = await fsp.readFile(pidPath, "utf8");
    const firstLine = content.split(/\r?\n/)[0]?.trim();
    const pid = Number.parseInt(firstLine ?? "", 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      await fsp.unlink(pidPath).catch(() => undefined);
      return;
    }

    try {
      process.kill(pid, 0);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ESRCH") {
        await fsp.unlink(pidPath).catch(() => undefined);
      }
    }
  } catch {
    // Ignore read errors and let Postgres handle it
  }
}

export async function ensureLocalPostgres({
  databaseDir = "./.pgdata",
  port = 5432
} = {}) {
  if (await isPortOpen(port)) {
    console.log(`Postgres is already running on port ${port}.`);
    return null;
  }

  await cleanupStalePidFile(databaseDir);

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--no-locale"]
  });

  const isInitialised = fs.existsSync(path.join(databaseDir, "PG_VERSION"));
  if (!isInitialised) {
    await pg.initialise();
    console.log("Embedded Postgres initialised.");
  }

  await pg.start();
  console.log(`Embedded Postgres started on port ${port}.`);

  try {
    await pg.createDatabase("wahaj_store");
    console.log("Database wahaj_store created.");
  } catch {
    console.log("Database wahaj_store already exists.");
  }

  return pg;
}
