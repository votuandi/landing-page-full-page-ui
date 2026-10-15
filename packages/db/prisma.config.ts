import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // No fallback to runtime credentials. generate/validate still work offline.
  datasource: { url: process.env.MIGRATION_DATABASE_URL },
});
