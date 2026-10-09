import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validatePrTitle } from "./pr-meta.mjs";

const cli = fileURLToPath(new URL("./pr-meta.mjs", import.meta.url));
const cases = [
  ["[E0-S05] quy trình", true],
  ["chore: quy trình [E0-S05]", true],
  ["[E123-S456] nhiều chữ số", true],
  ["chore: 'quote' `backtick` $(echo unsafe) [E0-S05]", true],
  [undefined, false], ["", false], ["không ID", false],
  ["[E?-S??]", false], ["E0-S05", false], ["[E0-S]", false],
  ["[e0-s05]", false], ["[E0-S05", false], ["[E0-S05x]", false],
];
for (const [title, valid] of cases) {
  test(`title ${JSON.stringify(title)} → ${valid}`, () => {
    assert.equal(validatePrTitle(title), valid);
    const env = { ...process.env };
    delete env.PR_TITLE;
    if (title !== undefined) env.PR_TITLE = title;
    const result = spawnSync(process.execPath, [cli], { env, encoding: "utf8" });
    assert.equal(result.status, valid ? 0 : 1, result.stderr);
    assert.match(result.stdout + result.stderr, valid ? /PASS/ : /\[E0-S05\]/);
  });
}
