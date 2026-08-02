import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import vars from "../configs/config";

const pool = new Pool({
  connectionString: vars.DATABASE_URL!,
});

const db = drizzle({ client: pool });

export default db;