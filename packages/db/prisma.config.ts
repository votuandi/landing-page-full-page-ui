import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // generate/validate/diff work without a DB; DB commands require DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL },
});
