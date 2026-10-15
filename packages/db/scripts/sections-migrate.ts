import { createPlatformDb } from "../src/client.ts";
import { runSectionsMigrate } from "../src/sectionsMigrate.ts";

let db: ReturnType<typeof createPlatformDb> | undefined;
try {
  const args = process.argv.slice(2);
  let dryRun = false, file: string | undefined;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--dry-run") dryRun = true;
    else if (args[index] === "--file" && args[index + 1] && !args[index + 1].startsWith("--")) file = args[++index];
    else throw new Error(`Unknown or incomplete argument: ${args[index]}`);
  }
  if (!file) db = createPlatformDb({ pool: 2 });
  const result = await runSectionsMigrate({ db, dryRun, file });
  process.exitCode = result.errors ? 1 : 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await db?.$disconnect(); }
