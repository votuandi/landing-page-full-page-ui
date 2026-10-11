import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
test("web, ui and sections block static imports, require and dynamic imports of database internals; db allows them", async () => {
  const db = new ESLint({ cwd: `${root}/packages/db`, overrideConfigFile: `${root}/packages/db/eslint.config.mjs` });
  for (const workspace of ["apps/web", "packages/ui", "packages/sections"]) {
    const app = new ESLint({ cwd: `${root}/${workspace}`, overrideConfigFile: `${root}/${workspace}/eslint.config.mjs` });
    for (const source of ["@prisma/client", "@prisma/adapter-pg", "pg", "pg/lib/client", "../../../db/generated/client", "@solar/db/generated/client"]) {
      for (const [code, rule] of [
        [`import { PrismaClient } from "${source}"; export { PrismaClient };`, "no-restricted-imports"],
        [`export const driver = require("${source}");`, "no-restricted-syntax"],
        [`export const driver = import("${source}");`, "no-restricted-syntax"],
      ]) {
        const [blocked] = await app.lintText(code, { filePath: `${root}/${workspace}/src/x.ts` });
        assert.equal(blocked.messages.filter((message) => message.ruleId === rule).length, 1, `${workspace}: ${code}`);
        const [allowed] = await db.lintText(code, { filePath: `${root}/packages/db/src/x.ts` });
        assert.equal(allowed.errorCount, 0, code);
      }
    }
    for (const code of ['import { forTenant } from "@solar/db"; export { forTenant };', 'export const path = require("node:path");', 'export const path = import("node:path");']) {
      const [allowed] = await app.lintText(code, { filePath: `${root}/${workspace}/src/x.ts` });
      assert.equal(allowed.errorCount, 0, code);
    }
  }
});
