import { createPlatformDb } from "@solar/db";
import { seedDemoTenant } from "../../../packages/db/prisma/seed-demo.ts";

const platformDomain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";

async function main() {
  if (process.argv[2] !== "setup") throw new Error("Unknown fixture action: expected setup");
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD is required");
  const db = createPlatformDb({ pool: 2 });
  try {
    // Upsert without deleting tenants: running servers cache these tenant/site identities by host.
    for (const id of ["t08", "t12", "t13", "t15"] as const) {
      const slug = `journey-${id}`;
      await seedDemoTenant(db, { id, slug, hostname: `${slug}.${platformDomain}`, password });
    }
  } finally { await db.$disconnect(); }
}

void main();
