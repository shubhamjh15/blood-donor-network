// Zero-install local MongoDB for development.
// Downloads a mongod binary on first run and persists data in ./.mongo-data
import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbPath = path.resolve(".mongo-data");
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});

console.log(`\n🩸 Local MongoDB running at ${server.getUri()}bloodline`);
console.log(`   Data persisted in ${dbPath}\n`);

const shutdown = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
