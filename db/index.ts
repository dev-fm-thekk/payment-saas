import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import vars from "../configs/config";

const createPool = () => {
  return new Pool({
    connectionString: vars.DATABASE_URL!,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Increased to 10s to accommodate Neon DB cold starts
  });
};

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

// Use existing pool if it exists (singleton pattern), otherwise create a new one
const pool = globalForDb.pool ?? createPool();

globalForDb.pool = pool;

const db = drizzle({ client: pool });

export default db;