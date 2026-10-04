import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/** Database connection for command-line scripts (seed, create-admin). */
export function connectScript() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in .env");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  return { pool, db: drizzle(pool, { schema }) };
}
