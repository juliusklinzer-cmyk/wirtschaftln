import { defineConfig } from 'drizzle-kit';

// Zweite drizzle-kit-Config für die Verzeichnis-DB:
//   npm run db:generate:directory
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/directory-schema.ts',
  out: './drizzle-directory',
  dbCredentials: {
    url: process.env.DATA_DIR ? `${process.env.DATA_DIR}/directory.db` : './data/directory.db',
  },
});
