import { drizzle } from 'drizzle-orm/neon-http';
import vars from '../configs/config';

const db = drizzle(vars.DATABASE_URL!);

export default db;
