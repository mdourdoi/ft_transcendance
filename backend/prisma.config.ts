import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://build:build@localhost:5432/build',
  },
});
