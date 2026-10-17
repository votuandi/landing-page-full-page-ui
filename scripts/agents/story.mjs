#!/usr/bin/env node
// Đọc story trong roadmap/epics/*.md và tính các thông số cho playbook /run-story.
//   node scripts/agents/story.mjs info E1-S01   → JSON: người làm, reviewer, branch, phụ thuộc, lệnh kiểm tra
//   node scripts/agents/story.mjs next          → story chưa xong đầu tiên có đủ phụ thuộc
//   node scripts/agents/story.mjs list [--todo] → bảng trạng thái mọi story
//   node scripts/agents/story.mjs load          → ước lượng tỷ lệ tải Claude/Codex theo routing.json
//   node scripts/agents/story.mjs progress [ID|Ex] → JSON: % tiến độ story/epic + ước lượng thời gian còn lại (/get-progress)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
        // Chỉ heading ✅ (gắn sau khi người dùng merge) mới là "đã merge"; AC tick đủ trên branch chưa merge thì chưa.
        merged: rawTitle.includes("✅"),
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
 * planMode: "claude" (Claude viết plan) | "codex-draft" (Codex viết nháp → Claude duyệt).
 * planBrief: true khi Codex khảo sát (brief) trước để Claude viết plan; false khi Claude tự khảo sát.
 * routing.planPolicy: "claude" = Claude tự viết plan mọi story, Codex chỉ implement | "budget" = theo budget/architecture.
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
  const planPolicy = routing.planPolicy ?? "budget";
  if (planPolicy === "claude") planMode = "claude";
  const planBrief = planMode === "claude" && planPolicy !== "claude";
  return { mode, planMode, planBrief, architecture };
}

function describe(story, stories) {
  const other = (agent) => (agent === "claude" ? "codex" : "claude");
  const { mode, planMode, planBrief, architecture } = routeStory(story.id);
  const kind = mode === "codex" ? "logic" : "ui";
  // Skill theo vai (exec/selfReview/fix/review/plan): phần "all" + theo kind + theo architecture.
  const { whenRelevant = {}, ...roles } = routing.skills ?? {};
  const skills = Object.fromEntries(Object.entries(roles).map(([role, by]) =>
    [role, [...new Set([...(by.all ?? []), ...(by[kind] ?? []), ...(architecture ? by.architecture ?? [] : [])])]]));
  // split: Codex viết phần lớn code → tính là người viết; Claude làm design pass.
  const author = mode === "claude" ? "claude" : "codex";
  const parity = storyNum(story.id) % 2 === 1 ? "odd" : "even";
  // reviewPolicy: "parity" (lẻ → codex, chẵn → claude) | "codex" / "claude" (agent đó review tất cả)
  //             | "codex-except-architecture" (Codex review tất cả, trừ story kiến trúc do Claude review)
  const policy = routing.reviewPolicy ?? "parity";
  let reviewer =
    policy === "codex" || policy === "claude" ? policy
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
    planBrief,
    architecture,
    author,
    designPass: mode === "split" ? "claude" : null,
    codexEffort: {
      exec: routing.codexEffort[story.size] ?? "high",
      plan: routing.codexEffort.plan,
      review: routing.codexEffort.review,
      reReview: routing.codexEffort.reReview ?? "medium",
    },
    claudeReviewModel: routing.claudeReviewModel,
    skills: { ...skills, whenRelevant },
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

// ---- progress: % tiến độ theo bước của /run-story + ước lượng thời gian còn lại từ lịch sử .agent-runs ----

const IDLE_MIN = 60; // khoảng lặng > 60 phút giữa hai lần ghi file/commit = nghỉ, không tính vào thời gian làm
const sizePts = { S: 1, M: 2, L: 4 };
const git = (...args) => {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
};

/** Mốc thời gian (ms) của story: mtime file trong .agent-runs/<ID> + commit trên branch của nó. */
function activityTimes(d) {
  const times = [];
  const dir = join(root, d.runDir);
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) times.push(statSync(join(dir, f)).mtimeMs);
  }
  if (git("rev-parse", "--verify", "--quiet", d.branch)) {
    for (const t of git("log", "--format=%at", `${d.base}..${d.branch}`).split("\n")) if (t) times.push(Number(t) * 1000);
  }
  // Bỏ mtime vô lý (file giải nén giữ mtime cũ).
  return times.filter((t) => t > Date.UTC(2024, 0, 1)).sort((a, b) => a - b);
}

/** Phút làm thực tế: cộng khoảng giữa các mốc liên tiếp, bỏ khoảng lặng > IDLE_MIN. */
function activeMinutes(times) {
  let total = 0;
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i] - times[i - 1]) / 60000;
    if (gap <= IDLE_MIN) total += gap;
  }
  return Math.round(total);
}

const shortTitle = (d) => d.title.replace(/\s*·\s*PR\b.*$/, "");
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Trung vị phút làm theo cỡ, từ các story đã xong có run dir. Cỡ thiếu mẫu (< 2) → suy từ phút/điểm chung. */
function historyBySize(all) {
  const samples = { S: [], M: [], L: [] };
  for (const d of all) {
    if (!d.done || !sizePts[d.size]) continue;
    const min = activeMinutes(activityTimes(d));
    if (min > 0) samples[d.size].push(min);
  }
  const perPoint = median(Object.entries(samples).flatMap(([size, xs]) => xs.map((x) => x / sizePts[size]))) ?? 60;
  return Object.fromEntries(
    Object.entries(samples).map(([size, xs]) => [
      size,
      { samples: xs.length, minutes: Math.round(xs.length >= 2 ? median(xs) : perPoint * sizePts[size]) },
    ]),
  );
}

/** Bước 0 của /run-story: có index codegraph chưa, đồ thị graphify có cũ hơn commit mới nhất của base không. */
function graphState() {
  const baseTime = Number(git("log", "-1", "--format=%ct", routing.base)) * 1000;
  const graph = join(root, "graphify-out", "graph.json");
  return {
    codegraph: existsSync(join(root, ".codegraph")) ? "codegraph sync" : "codegraph init -y",
    graphify: !existsSync(graph) ? "none" : statSync(graph).mtimeMs < baseTime ? "stale: python -m graphify update ." : "fresh",
  };
}

/** Bước hiện tại của story theo các dấu vết /run-story để lại → % (mốc cuối mỗi bước). */
function storyPhase(d) {
  if (d.merged) return { step: "Đã merge (✅)", percent: 100 };
  const run = (f) => join(root, d.runDir, f);
  const readJson = (f) => { try { return JSON.parse(readFileSync(run(f), "utf8")); } catch { return null; } };
  const hasBranch = Boolean(git("rev-parse", "--verify", "--quiet", d.branch));
  const subjects = hasBranch ? git("log", "--format=%s", `${d.base}..${d.branch}`).split("\n").filter(Boolean) : [];
  const codeCommits = subjects.filter((s) => !s.startsWith("docs(plan)")).length;
  const reviews = existsSync(join(root, d.runDir))
    ? readdirSync(join(root, d.runDir)).filter((f) => /^review-r\d+\.md$/.test(f)).sort((a, b) => Number(a.match(/\d+/)) - Number(b.match(/\d+/)))
    : [];
  const lastVerdict = reviews.length ? readFileSync(run(reviews.at(-1)), "utf8").match(/VERDICT:\s*(\w+)/)?.[1] ?? null : null;
  const verify = readJson("verify.json");
  const verifyOk = Boolean(verify?.checks?.length && verify.checks.every((c) => c.ok));
  const pr = readJson("pr.json");
  const facts = { hasPlan: existsSync(join(root, d.planFile)), hasBranch, codeCommits, verifyOk, pr: pr?.url ?? null, reviewRounds: reviews.length, lastVerdict };
  if (lastVerdict === "APPROVE") return { step: "Review APPROVE — chờ CI xanh / người dùng merge", percent: 95, facts };
  if (reviews.length) return { step: `Review–sửa vòng ${reviews.length} (${lastVerdict ?? "đang review"})`, percent: Math.min(70 + reviews.length * 5, 90), facts };
  if (pr) return { step: "Đã tạo PR — chờ review", percent: 70, facts };
  if (verifyOk) return { step: "Kiểm tra qua — chờ push/tạo PR", percent: 60, facts };
  if (codeCommits) return { step: verify ? "Đang sửa lỗi kiểm tra" : "Đã có code — chờ verify", percent: verify ? 50 : 55, facts };
  if (hasBranch) return { step: "Đang thực thi (chưa có commit code)", percent: 25, facts };
  if (facts.hasPlan) return { step: "Đã có plan — chưa tạo branch", percent: 15, facts };
  return { step: "Chưa bắt đầu", percent: 0, facts };
}

function progress(target) {
  const all = [...stories.values()].map((s) => describe(s, stories));
  const id = (target ?? git("branch", "--show-current").match(/E\d+-S\d+/)?.[0] ?? all.find((d) => !d.done && d.ready)?.id)?.toUpperCase();
  const history = historyBySize(all);
  const estimate = (d) => history[d.size || "M"].minutes;

  const storyReport = (d) => {
    const phase = storyPhase(d);
    const elapsed = activeMinutes(activityTimes(d));
    return {
      id: d.id, title: shortTitle(d), size: d.size, branch: d.branch, ...phase,
      ac: `${d.acDone}/${d.acTotal}`, elapsedMinutes: elapsed,
      estimateMinutes: estimate(d),
      remainingMinutes: Math.round(estimate(d) * (1 - phase.percent / 100)),
      overEstimate: elapsed > estimate(d),
    };
  };

  const epicId = /^E\d+$/.test(id ?? "") ? id : id && epicOf(id);
  const inEpic = all.filter((d) => d.epic === epicId);
  if (!inEpic.length) {
    console.error(`Không tìm thấy story/epic "${target ?? ""}". Ví dụ: node scripts/agents/story.mjs progress E5-S08 | E5`);
    process.exit(1);
  }
  let pts = 0, donePts = 0, remaining = 0;
  const rows = inEpic.map((d) => {
    const r = storyReport(d);
    const p = sizePts[d.size] ?? 2;
    pts += p;
    donePts += (p * r.percent) / 100;
    remaining += r.remainingMinutes;
    return { id: d.id, size: d.size, percent: r.percent, step: r.step, ready: d.ready, title: shortTitle(d) };
  });
  return {
    story: /^E\d+-S\d+$/.test(id) ? storyReport(all.find((d) => d.id === id)) : null,
    epic: {
      id: epicId,
      percent: Math.round((donePts / pts) * 100),
      storiesDone: rows.filter((r) => r.percent === 100).length,
      storiesTotal: rows.length,
      remainingMinutes: Math.round(remaining),
      stories: rows,
    },
    history: { idleCutoffMinutes: IDLE_MIN, bySize: history },
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
  console.log(JSON.stringify({ ...describe(story, stories), graphs: graphState() }, null, 2));
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
  // Ước lượng tải theo điểm: S=1, M=2, L=4. Plan: Claude viết = 1 điểm Claude (+0,3 Codex nếu có brief);
  // Codex nháp = 0,3 điểm Claude (duyệt).
  const pts = { S: 1, M: 2, L: 4 };
  const load = { claude: 0, codex: 0 };
  for (const s of stories.values()) {
    const d = describe(s, stories);
    if (d.done) continue;
    const p = pts[d.size] ?? 2;
    if (d.planMode === "claude") { load.claude += 1; if (d.planBrief) load.codex += 0.3; } else { load.codex += 1; load.claude += 0.3; }
    if (d.mode === "claude") load.claude += p;
    else if (d.mode === "split") { load.codex += p * 0.7; load.claude += p * 0.3; }
    else load.codex += p;
    // Review ~ 0,5 điểm/story cho reviewer.
    load[d.reviewer] += 0.5;
  }
  const total = load.claude + load.codex;
  console.log(`budget=${routing.budget}  Claude ${load.claude.toFixed(0)} điểm (${((load.claude / total) * 100).toFixed(0)}%)  ·  Codex ${load.codex.toFixed(0)} điểm (${((load.codex / total) * 100).toFixed(0)}%)`);
} else if (cmd === "progress") {
  console.log(JSON.stringify(progress(arg), null, 2));
} else {
  console.error("Dùng: node scripts/agents/story.mjs info <ID> | next | list [--todo] | load | progress [ID|Ex]");
  process.exit(1);
}
