import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test("CLI checks TSX and CSS, suggestions, exemptions and ignored directories", () => {
  const dir = mkdtempSync(join(tmpdir(), "solar-tokens-"));
  const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
  const run = () => spawnSync(process.execPath, [cli, "src"], { cwd: dir, encoding: "utf8" });
  try {
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src", "bad.tsx"), '<div className="bg-[#0E7C3A]" />');
    writeFileSync(join(dir, "src", "bad.css"), '.x { color: rgba(1,2,3,.4); }');
    let result = run();
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /bad.tsx:1:\d+.*bg-primary/);
    assert.match(result.stdout, /bad.css:1:\d+.*var\(--c-/);
    assert.match(result.stdout, /lint:tokens: 2 vi phạm/);
    writeFileSync(join(dir, "src", "bad.tsx"), '// eslint-disable-next-line react-hooks/exhaustive-deps\n<div className="bg-primary" />');
    writeFileSync(join(dir, "src", "bad.css"), '/* token-exempt: brand\n*/ .x { color: #fff; }\n.y { color: rgb(var(--c-primary)); }');
    for (const name of ["node_modules", ".next", "dist", ".test-dist", "brand-icons"]) {
      mkdirSync(join(dir, "src", name));
      writeFileSync(join(dir, "src", name, "ignored.tsx"), '<svg fill="#fff" />');
      writeFileSync(join(dir, "src", name, "ignored.css"), '.x { color: #fff; }');
    }
    result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /lint:tokens: 0 vi phạm/);
    writeFileSync(join(dir, "src", "bad.css"), '/* token-exempt: */\n.x { color: #fff; }');
    assert.equal(run().status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
