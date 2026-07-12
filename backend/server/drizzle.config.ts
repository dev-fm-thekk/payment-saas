import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import vars from './configs/config';

export default defineConfig({
  out: './server/drizzle',
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: vars.DATABASE_URL!,
  },
});
