import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import vars from './config';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/',
  dialect: 'postgresql',
  dbCredentials: {
    url: vars.DATABASE_URL!,
  },
});
