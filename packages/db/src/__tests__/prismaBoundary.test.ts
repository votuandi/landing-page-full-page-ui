import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
test("application imports of database drivers/generated clients fail lint; db imports are allowed", async () => {
  const web = new ESLint({ cwd: `${root}/apps/web`, overrideConfigFile: `${root}/apps/web/eslint.config.mjs` });
  const db = new ESLint({ cwd: `${root}/packages/db`, overrideConfigFile: `${root}/packages/db/eslint.config.mjs` });
  for (const source of ["@prisma/client", "@prisma/adapter-pg", "pg", "../../../db/generated/client", "@solar/db/generated/client"]) {
    const code = `import { PrismaClient } from "${source}"; export { PrismaClient };`;
    const [blocked] = await web.lintText(code, { filePath: `${root}/apps/web/src/app/x.ts` });
    assert.equal(blocked.messages.filter((message) => message.ruleId === "no-restricted-imports").length, 1, source);
    const [allowed] = await db.lintText(code, { filePath: `${root}/packages/db/src/x.ts` });
    assert.equal(allowed.errorCount, 0, source);
  }
});
