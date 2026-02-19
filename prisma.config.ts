import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

const pooledUrl = process.env["DATABASE_URL"];
const unpooledUrl = process.env["DATABASE_URL_UNPOOLED"];
const vercelPrismaUrl = process.env["POSTGRES_PRISMA_URL"];
const databaseUrl = vercelPrismaUrl || unpooledUrl || pooledUrl;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required and must point to PostgreSQL.");
}
if (databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL must be PostgreSQL (postgresql://...), not SQLite file: URL.");
}
if (unpooledUrl && unpooledUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL_UNPOOLED must be PostgreSQL (postgresql://...), not SQLite file: URL.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
