#!/usr/bin/env node
// Đọc story trong roadmap/epics/*.md và tính các thông số cho playbook /run-story.
//   node scripts/agents/story.mjs info E1-S01   → JSON: người làm, reviewer, branch, phụ thuộc, lệnh kiểm tra
//   node scripts/agents/story.mjs next          → story chưa xong đầu tiên có đủ phụ thuộc
//   node scripts/agents/story.mjs list [--todo] → bảng trạng thái mọi story
//   node scripts/agents/story.mjs load          → ước lượng tỷ lệ tải Claude/Codex theo routing.json
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const epicsDir = join(root, "roadmap", "epics");
const routing = JSON.parse(readFileSync(process.env.ROUTING_FILE ?? join(here, "routing.json"), "utf8"));

const storyNum = (id) => Number(id.split("-S")[1]);
const epicOf = (id) => id.split("-")[0];

function slugify(text, maxWords = 5) {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    .split(/\s+/).slice(0, maxWords).join("-");
}

/** Phụ thuộc trong dòng "Phụ thuộc: S01, E9-S02, E3-S01…S04, E7" → danh sách ID story hoặc epic. */
function parseDeps(rawLine, epicId) {
  // Bỏ phần giải thích trong ngoặc, vd. "E4-S01…S10 (không gồm E4-S11 …)".
  const line = rawLine.replace(/\([^)]*\)/g, "");
  const deps = new Set();
  const storyRe = /(?:\b(E\d+)-)?S(\d+)(?:\s*(?:…|\.\.\.)\s*S(\d+))?/g;
  for (const [, epic = epicId, from, to] of line.matchAll(storyRe)) {
    for (let n = Number(from); n <= Number(to ?? from); n++) deps.add(`${epic}-S${String(n).padStart(2, "0")}`);
  }
  for (const [, epic] of line.matchAll(/\b(E\d+)\b(?!-S)/g)) deps.add(epic);
  return [...deps];
}

function loadStories() {
  const stories = new Map();
  for (const file of readdirSync(epicsDir).filter((f) => /^E\d+-.+\.md$/.test(f)).sort()) {
    const text = readFileSync(join(epicsDir, file), "utf8").replace(/\r\n/g, "\n");
    const epicId = `E${Number(file.match(/^E(\d+)/)[1])}`;
    // Phụ thuộc cấp epic: dòng "**Phụ thuộc**: …", chỉ lấy tới dấu "." hoặc ";" đầu tiên (phần sau là giải thích).
    const epicDepText = text.split(/^### /m)[0].match(/\*\*Phụ thuộc\*\*:\s*([^\n]*)/)?.[1] ?? "";
    const epicDeps = parseDeps(epicDepText.replace(/\([^)]*\)/g, "").split(/\.\s|;|\.$/)[0], epicId);
    for (const part of text.split(/^### /m).slice(1)) {
      const head = part.match(/^(E\d+-S\d+)\s*·\s*(.+)$/m);
      if (!head) continue;
      const [, id, rawTitle] = head;
      const body = part.split(/\n---\n/)[0];
      const checked = (body.match(/- \[x\]/gi) ?? []).length;
      const unchecked = (body.match(/- \[ \]/g) ?? []).length;
      const depLine = body.match(/Phụ thuộc:\s*([^\n]+?)(?:\s·\s|\n|$)/)?.[1] ?? "";
      stories.set(id, {
        id,
        epic: epicId,
        epicFile: `roadmap/epics/${file}`,
        title: rawTitle.replace(/✅/g, "").trim(),
        done: rawTitle.includes("✅") || (checked > 0 && unchecked === 0),
        acTotal: checked + unchecked,
        acDone: checked,
        deps: [...new Set([...epicDeps, ...parseDeps(depLine, epicId)])].filter((d) => d !== id && d !== epicId),
        agentHint: body.match(/Agent:\s*([^·\n]+)/)?.[1]?.trim() ?? "",
        size: body.match(/Cỡ:\s*([SML])/)?.[1] ?? "",
      });
    }
  }
  return stories;
}

function depStatus(story, stories) {
  return story.deps.map((dep) => {
    if (/^E\d+$/.test(dep)) {
      const inEpic = [...stories.values()].filter((s) => s.epic === dep);
      return { dep, done: inEpic.length > 0 && inEpic.every((s) => s.done) };
    }
    return { dep, done: stories.get(dep)?.done ?? false, missing: !stories.has(dep) };
  });
}

/**
 * mode: "claude" (Claude viết toàn bộ) | "split" (Codex dựng, Claude design pass) | "codex".
 * planMode: "claude" (Codex khảo sát → Claude viết plan) | "codex-draft" (Codex viết nháp → Claude duyệt).
 */
function routeStory(id) {
  const budget = routing.budget ?? "balanced";
  let mode = routing.claudeFull.includes(id) ? "claude" : routing.split.includes(id) ? "split" : "codex";
  if (budget === "claude-saver" && mode === "claude") mode = "split";
  if (budget === "codex-saver" && mode === "split") mode = "claude";
  const override = routing.authorOverride[id];
  if (override) mode = override === "claude" ? "claude" : "codex";
  const architecture = routing.architecture.includes(id);
  let planMode = architecture || mode !== "codex" ? "claude" : "codex-draft";
  if (budget === "claude-saver" && !architecture) planMode = "codex-draft";
  if (budget === "codex-saver") planMode = "claude";
  return { mode, planMode, architecture };
}

function describe(story, stories) {
  const other = (agent) => (agent === "claude" ? "codex" : "claude");
  const { mode, planMode, architecture } = routeStory(story.id);
  const kind = mode === "codex" ? "logic" : "ui";
  // split: Codex viết phần lớn code → tính là người viết; Claude làm design pass.
  const author = mode === "claude" ? "claude" : "codex";
  const parity = storyNum(story.id) % 2 === 1 ? "odd" : "even";
  // reviewPolicy: "parity" (lẻ → codex, chẵn → claude) | "codex" (Codex review tất cả)
  //             | "codex-except-architecture" (Codex review tất cả, trừ story kiến trúc do Claude review)
  const policy = routing.reviewPolicy ?? "parity";
  let reviewer =
    policy === "codex" ? "codex"
    : policy === "codex-except-architecture" ? (architecture ? "claude" : "codex")
    : routing.reviewerByParity[parity];
  if (reviewer === author && routing.selfReview === "swap") reviewer = other(author);
  const selfReviewConflict = reviewer === author;
  const branchType = routing.branchType[story.epic] ?? "feat";
  const pnpm = existsSync(join(root, "pnpm-workspace.yaml"));
  const deps = depStatus(story, stories);
  // buildPolicy "epic-last": chỉ story cuối của epic chạy build; story khác bỏ build để tiết kiệm thời gian.
  const epicIds = [...stories.values()].filter((s) => s.epic === story.epic).map((s) => s.id);
  const epicLast = epicIds[epicIds.length - 1] === story.id;
  const build = (routing.buildPolicy ?? "always") === "always" || epicLast;
  return {
    ...story,
    kind,
    mode,
    planMode,
    architecture,
    author,
    designPass: mode === "split" ? "claude" : null,
    codexEffort: {
      exec: routing.codexEffort[story.size] ?? "high",
      plan: routing.codexEffort.plan,
      review: routing.codexEffort.review,
    },
    claudeReviewModel: routing.claudeReviewModel,
    parity,
    reviewer,
    selfReviewConflict,
    base: routing.base,
    branch: `${branchType}/${story.id}-${slugify(story.title)}`,
    commitType: branchType,
    planFile: `roadmap/plans/${story.id}.md`,
    runDir: `.agent-runs/${story.id}`,
    epicLast,
    checks: pnpm
      ? [`pnpm turbo run typecheck lint test${build ? " build" : ""}`]
      : ["yarn typecheck", "yarn lint", "yarn test", ...(build ? ["yarn build"] : [])],
    depStatus: deps,
    ready: deps.every((d) => d.done),
  };
}

const [cmd, arg] = process.argv.slice(2);
const stories = loadStories();

if (cmd === "info") {
  const story = stories.get(arg?.toUpperCase());
  if (!story) {
    console.error(`Không tìm thấy story "${arg}". Ví dụ: node scripts/agents/story.mjs info E1-S01`);
    process.exit(1);
  }
  console.log(JSON.stringify(describe(story, stories), null, 2));
} else if (cmd === "next") {
  const next = [...stories.values()].map((s) => describe(s, stories)).find((s) => !s.done && s.ready);
  if (!next) {
    console.error("Không còn story nào sẵn sàng (chưa xong và đủ phụ thuộc).");
    process.exit(1);
  }
  console.log(JSON.stringify(next, null, 2));
} else if (cmd === "list") {
  const todoOnly = arg === "--todo";
  for (const s of stories.values()) {
    const d = describe(s, stories);
    if (todoOnly && d.done) continue;
    const status = d.done ? "xong" : d.ready ? "sẵn sàng" : "chờ";
    const who = d.mode === "split" ? "codex+design" : d.author;
    console.log(`${d.id.padEnd(7)} ${status.padEnd(8)} plan:${d.planMode.padEnd(11)} ${who.padEnd(12)} → review ${d.reviewer.padEnd(6)} ${d.size || "-"}  ${d.title}`);
  }
} else if (cmd === "load") {
  // Ước lượng tải theo điểm: S=1, M=2, L=4. Plan: Claude viết = 1 điểm Claude; Codex nháp = 0,3 điểm Claude (duyệt).
  const pts = { S: 1, M: 2, L: 4 };
  const load = { claude: 0, codex: 0 };
  for (const s of stories.values()) {
    const d = describe(s, stories);
    if (d.done) continue;
    const p = pts[d.size] ?? 2;
    if (d.planMode === "claude") { load.claude += 1; load.codex += 0.3; } else { load.codex += 1; load.claude += 0.3; }
    if (d.mode === "claude") load.claude += p;
    else if (d.mode === "split") { load.codex += p * 0.7; load.claude += p * 0.3; }
    else load.codex += p;
    // Review ~ 0,5 điểm/story cho reviewer.
    load[d.reviewer] += 0.5;
  }
  const total = load.claude + load.codex;
  console.log(`budget=${routing.budget}  Claude ${load.claude.toFixed(0)} điểm (${((load.claude / total) * 100).toFixed(0)}%)  ·  Codex ${load.codex.toFixed(0)} điểm (${((load.codex / total) * 100).toFixed(0)}%)`);
} else {
  console.error("Dùng: node scripts/agents/story.mjs info <ID> | next | list [--todo] | load");
  process.exit(1);
}
