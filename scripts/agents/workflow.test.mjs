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

test("skills: S.skills theo loại story, run.mjs skills đối chiếu log Codex với report", () => {
  const root = mkdtempSync(join(tmpdir(), "solar-skills-"));
  try {
    const scripts = join(root, "scripts", "agents");
    const epics = join(root, "roadmap", "epics");
    const runDir = join(root, ".agent-runs", "E0-S05");
    for (const dir of [scripts, epics, runDir]) mkdirSync(dir, { recursive: true });
    for (const file of ["run.mjs", "story.mjs"]) copyFileSync(join(source, file), join(scripts, file));
    const routing = JSON.parse(readFileSync(join(source, "routing.json"), "utf8"));
    routing.authorOverride = {};
    routing.split = ["E0-S05"];
    routing.claudeFull = [];
    writeFileSync(join(scripts, "routing.json"), JSON.stringify(routing));
    writeFileSync(join(epics, "E00-fixture.md"), "### E0-S05 · Fixture\n- [ ] AC\n- Agent: Codex · Cỡ: S\n");
    const cli = (file, ...args) => {
      const result = spawnSync(process.execPath, [join(scripts, file), ...args], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    };
    const info = cli("story.mjs", "info", "E0-S05");
    assert.equal(info.kind, "ui");
    for (const skill of ["ponytail", "verification-before-completion", "codegraph", "vercel-react-best-practices"]) {
      assert.ok(info.skills.exec.includes(skill), skill);
    }
    assert.ok(info.skills.selfReview.includes("ponytail-review"));
    assert.ok(info.skills.fix.includes("receiving-code-review"));
    assert.ok(info.skills.review.includes("web-design-guidelines"));
    assert.equal(typeof info.skills.whenRelevant["playwright-cli"], "string");

    writeFileSync(join(runDir, "codex-report.md"), "## Skill đã dùng\n\nponytail, codegraph, graphify\n");
    // Chỉ dòng lệnh (ngay sau dòng "exec") được tính; chữ trong tài liệu Codex in ra thì không.
    // Đường dẫn Windows và POSIX đều nhận; codegraph là CLI nên đếm khi lệnh được chạy.
    writeFileSync(join(runDir, "codex-exec.log"), [
      "exec", "pwsh -Command 'Get-Content .agents/skills/ponytail/SKILL.md'",
      "exec", "Get-Content .agents\\skills\\test-driven-development\\SKILL.md",
      "exec", "cat .agents/skills/verification-before-completion/SKILL.md",
      "- `codegraph impact <symbol>` và .agents/skills/vercel-react-best-practices/SKILL.md (chữ trong tài liệu)",
      "exec", "codegraph impact validateSiteStructure",
    ].join("\n"));
    // Lượt "Tiếp tục" ghi log riêng; vẫn được tính.
    writeFileSync(join(runDir, "codex-exec-r2.log"), "exec\ncat .agents/skills/vercel-composition-patterns/SKILL.md\n");
    const report = cli("run.mjs", "skills", "E0-S05");
    assert.deepEqual(report.missing, ["vercel-react-best-practices", "ponytail-review"]);
    assert.deepEqual(report.claimedNotOpened, ["graphify"]);
    assert.ok(report.opened.includes("codegraph"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("progress: % theo bước /run-story và % epic theo điểm cỡ", () => {
  const root = mkdtempSync(join(tmpdir(), "solar-progress-"));
  try {
    const scripts = join(root, "scripts", "agents");
    const epics = join(root, "roadmap", "epics");
    const runDir = join(root, ".agent-runs", "E0-S02");
    for (const dir of [scripts, epics, runDir]) mkdirSync(dir, { recursive: true });
    for (const file of ["story.mjs", "routing.json"]) copyFileSync(join(source, file), join(scripts, file));
    writeFileSync(join(epics, "E00-fixture.md"), "### E0-S01 · Xong ✅\n- [x] AC\n- Cỡ: S\n\n### E0-S02 · Đang làm\n- [ ] AC\n- Cỡ: S\n\n### E0-S03 · Chưa\n- [ ] AC\n- Cỡ: M\n");
    writeFileSync(join(runDir, "pr.json"), JSON.stringify({ number: 1, url: "https://example.test/pr/1" }));
    writeFileSync(join(runDir, "review-r1.md"), "VERDICT: CHANGES_REQUESTED\n");
    const env = { ...process.env };
    delete env.ROUTING_FILE;
    const run = (...args) => {
      const result = spawnSync(process.execPath, [join(scripts, "story.mjs"), "progress", ...args], { cwd: root, env, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    };
    const { story, epic } = run("E0-S02");
    assert.equal(story.percent, 75);
    assert.equal(story.facts.reviewRounds, 1);
    assert.equal(epic.percent, 44); // (1×100 + 1×75 + 2×0) / 4 điểm
    assert.equal(epic.storiesDone, 1);
    writeFileSync(join(runDir, "review-r2.md"), "VERDICT: APPROVE\n");
    assert.equal(run("E0-S02").story.percent, 95);
    assert.equal(run("E0").story, null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
