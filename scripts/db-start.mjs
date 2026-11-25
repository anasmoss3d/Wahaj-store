import { ensureLocalPostgres } from "./local-db.mjs";

const pg = await ensureLocalPostgres();

if (!pg) {
  process.exit(0);
}

console.log("Embedded Postgres is running on port 5432.");

const shutdown = async () => {
  await pg.stop().catch(() => undefined);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

setInterval(() => {}, 1_000_000);
