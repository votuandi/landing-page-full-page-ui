#!/usr/bin/env tsx
/**
 * Safe Prisma Migrate Reset Script
 * 
 * This script prevents accidental database resets by requiring explicit confirmation
 * and checking environment variables.
 */

import { execSync } from "child_process";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("⚠️  WARNING: This will DROP ALL DATA in your database!");
  console.log("⚠️  This action cannot be undone!\n");

  // Check environment
  const nodeEnv = process.env.NODE_ENV || "development";
  const databaseUrl = process.env.DATABASE_URL || "";

  if (nodeEnv === "production") {
    console.error("❌ ERROR: Cannot reset database in PRODUCTION environment!");
    console.error("   Set NODE_ENV=development to allow this operation.");
    process.exit(1);
  }

  // Check if DATABASE_URL contains production keywords
  const productionKeywords = ["prod", "production", "live", "staging"];
  const isProductionUrl = productionKeywords.some(
    (keyword) => databaseUrl.toLowerCase().includes(keyword)
  );

  if (isProductionUrl) {
    console.error("❌ ERROR: DATABASE_URL appears to be a production database!");
    console.error("   This operation is blocked for safety.");
    process.exit(1);
  }

  // Show database info
  if (databaseUrl) {
    // Mask password in URL
    const maskedUrl = databaseUrl.replace(
      /:\/\/[^:]+:[^@]+@/,
      "://***:***@"
    );
    console.log(`📊 Database: ${maskedUrl}`);
  }
  console.log(`🌍 Environment: ${nodeEnv}\n`);

  // Require explicit confirmation
  const confirmation1 = await question(
    "Type 'RESET' (all caps) to confirm: "
  );

  if (confirmation1 !== "RESET") {
    console.log("❌ Reset cancelled. Database was not modified.");
    rl.close();
    process.exit(0);
  }

  // Second confirmation
  const confirmation2 = await question(
    "\n⚠️  Are you absolutely sure? Type 'YES' (all caps) to proceed: "
  );

  if (confirmation2 !== "YES") {
    console.log("❌ Reset cancelled. Database was not modified.");
    rl.close();
    process.exit(0);
  }

  rl.close();

  // Execute the reset
  console.log("\n🔄 Resetting database...");
  try {
    execSync("npx prisma migrate reset --force", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("\n✅ Database reset completed successfully!");
  } catch (error) {
    console.error("\n❌ Database reset failed!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
