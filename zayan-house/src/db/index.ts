import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __zayanPool?: Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return new Pool({
    connectionString: url,
    max: 10,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = globalForDb.__zayanPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__zayanPool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export { schema };
