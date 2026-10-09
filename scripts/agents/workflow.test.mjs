import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = fileURLToPath(new URL("./", import.meta.url));
for (const [policy, reviewPolicy, author, reviewer, conflict] of [
  ["swap", "codex", "codex", "claude", false],
  ["allow", "codex", "codex", "codex", true],
  ["swap", "codex", "claude", "codex", false],
  ["swap", "claude", "codex", "claude", false],
  ["allow", "claude", "claude", "claude", true],
  ["swap", "claude", "claude", "codex", false],
]) {
  test(`${reviewPolicy}/${policy}: ${author} → ${reviewer}, title/body CLI`, () => {
    const root = mkdtempSync(join(tmpdir(), "solar-workflow-"));
    try {
      const scripts = join(root, "scripts", "agents");
      const epics = join(root, "roadmap", "epics");
      const runDir = join(root, ".agent-runs", "E0-S05");
      for (const dir of [scripts, epics, runDir]) mkdirSync(dir, { recursive: true });
      for (const file of ["run.mjs", "story.mjs"]) copyFileSync(join(source, file), join(scripts, file));
      const routing = JSON.parse(readFileSync(join(source, "routing.json"), "utf8"));
      routing.selfReview = policy;
      routing.reviewPolicy = reviewPolicy;
      routing.authorOverride = { "E0-S05": author };
      writeFileSync(join(scripts, "routing.json"), JSON.stringify(routing));
      writeFileSync(join(epics, "E00-fixture.md"), `### E0-S05 · ${"Tiêu đề `dài` ".repeat(30)}\n- [ ] AC\n- Agent: Claude · Cỡ: S\n`);
      writeFileSync(join(runDir, "codex-report.md"), "## AC → bằng chứng\n\nBằng chứng fixture\n\n## Lệch so với plan\n\nKhông\n");
      const env = { ...process.env };
      delete env.ROUTING_FILE;
      const cli = (file, ...args) => {
        const result = spawnSync(process.execPath, [join(scripts, file), ...args], { cwd: root, env, encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
        return JSON.parse(result.stdout);
      };
      const info = cli("story.mjs", "info", "E0-S05");
      assert.equal(info.author, author);
      assert.equal(info.reviewer, reviewer);
      assert.equal(info.selfReviewConflict, conflict);
      const result = cli("run.mjs", "pr-body", "E0-S05");
      assert.equal(result.title.length, 90);
      assert.match(result.title, /^chore: \[E0-S05\]/);
      assert.equal(result.title.includes("`"), false);
      const body = readFileSync(join(root, result.bodyFile), "utf8");
      assert.ok(body.includes(`Người viết: ${author} · Reviewer: ${reviewer}`));
      assert.equal(body.includes("Reviewer cùng loại agent"), conflict);
      for (const text of ["Bằng chứng fixture", "Mọi AC đạt", "typecheck · lint · test", "epic-last", "lint:tokens", "e2e", "SHA cuối", "P0/P1", "Tài liệu/roadmap", "tenantId", "Dependency"]) assert.ok(body.includes(text), text);
      assert.equal(body.includes("- [x]"), false, "Chưa verify/review: không tick DoD");
      // Verify xanh vẫn không chứng minh reviewer đã thực hiện review.
      writeFileSync(join(runDir, "verify.json"), JSON.stringify({ ok: true, checks: [], ac: "1/1", commits: 1, changedFiles: 2 }));
      cli("run.mjs", "pr-body", "E0-S05");
      assert.match(readFileSync(join(root, result.bodyFile), "utf8"), /- \[ \] Review theo policy/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
