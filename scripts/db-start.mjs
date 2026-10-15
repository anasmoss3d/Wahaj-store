import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: "./.pgdata",
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C", "--no-locale"]
});

try {
  await pg.start();
  console.log("Embedded Postgres started (existing cluster).");
} catch {
  await pg.initialise();
  await pg.start();
  console.log("Embedded Postgres initialised and started.");
}
try {
  await pg.createDatabase("wahaj_store");
  console.log("Database wahaj_store created.");
} catch {
  console.log("Database wahaj_store already exists.");
}
console.log("Embedded Postgres is running on port 5432.");
setInterval(() => {}, 1_000_000);
