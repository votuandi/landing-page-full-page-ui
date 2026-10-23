#!/usr/bin/env node
// Kiểm môi trường trước khi chạy test/e2e và dừng lệnh treo — để blocker lộ ra trong vài giây thay vì sau 20+ phút
// (E7-S14: Prisma client sinh dở, dev server zombie giữ cổng, Docker tắt, git lock).
//   node scripts/agents/doctor.mjs                         → kiểm Docker/Postgres/Redis, Prisma client, cổng e2e, git; exit 1 nếu có ✘
//   node scripts/agents/doctor.mjs run [--idle 10] -- <lệnh…> → chạy lệnh, dừng cả cây tiến trình khi không ra output quá
//                                                             --idle phút (exit 124, stderr "TREO: …"); còn lại giữ exit code
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { connect } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const windows = process.platform === "win32";
const sh = (cmd, args, timeout = 15000) => spawnSync(cmd, args, { cwd: root, encoding: "utf8", timeout });

function run(idleMinutes, command) {
  // Qua shell để chạy được pnpm.cmd trên Windows; quote tham số có khoảng trắng (C:\Program Files\…).
  const quote = (arg) => !/[\s"'$`]/.test(arg) ? arg : windows ? `"${arg.replace(/"/g, '\\"')}"` : `'${arg.replace(/'/g, `'\\''`)}'`;
  const child = spawn(command.map(quote).join(" "), { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], detached: !windows, shell: true });
  let last = Date.now();
  for (const [from, to] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) from.on("data", (chunk) => { last = Date.now(); to.write(chunk); });
  const timer = setInterval(() => {
    if (Date.now() - last < idleMinutes * 60_000) return;
    clearInterval(timer);
    process.stderr.write(`\nTREO: không có output ${idleMinutes} phút — dừng: ${command.join(" ")}\n`);
    if (windows) spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)]);
    else try { process.kill(-child.pid, "SIGKILL"); } catch { /* đã thoát */ }
    process.exit(124);
  }, Math.min(5000, idleMinutes * 60_000 / 2));
  child.on("exit", (code) => { clearInterval(timer); process.exit(code ?? 1); });
}

const listening = (port) => new Promise((resolve) => {
  const socket = connect({ port, host: "127.0.0.1" }, () => { socket.destroy(); resolve(true); });
  socket.on("error", () => resolve(false));
});
async function responds(port) {
  try { await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(5000), redirect: "manual" }); return true; } catch { return false; }
}
function portOwner(port) {
  if (!windows) return sh("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]).stdout?.trim() || "?";
  const line = sh("netstat", ["-ano", "-p", "TCP"]).stdout?.split("\n").find((l) => new RegExp(`:${port}\\s.*LISTENING`).test(l));
  return line?.trim().split(/\s+/).at(-1) ?? "?";
}

async function check() {
  const results = []; // [mức ✘|⚠, nội dung]
  const fail = (text) => results.push(["✘", text]), warn = (text) => results.push(["⚠", text]);
  if (sh("docker", ["info"]).status !== 0) fail("Docker không chạy — bật Docker Desktop rồi `bash scripts/local-ci.sh up`");
  else {
    for (const name of ["solar-local-pg", "solar-local-redis"]) {
      if (sh("docker", ["inspect", "-f", "{{.State.Running}}", name]).stdout?.trim() !== "true") fail(`Container ${name} không chạy — \`bash scripts/local-ci.sh up\``);
    }
    if (!results.length && sh("docker", ["exec", "solar-local-pg", "pg_isready", "-U", "postgres", "-d", "solar_e5"]).status !== 0) fail("Postgres chưa sẵn sàng (pg_isready)");
  }
  const generated = join(root, "packages", "db", "generated");
  if (!existsSync(join(generated, "client.ts"))) {
    fail(existsSync(generated) ? "Prisma client sinh dở (packages/db/generated thiếu client.ts) — xóa thư mục rồi `pnpm --filter @solar/db generate`"
      : "Chưa sinh Prisma client — `pnpm --filter @solar/db generate`");
  }
  // Cổng của mọi webServer e2e: server cũ không trả lời làm Playwright treo (reuseExistingServer).
  const ports = new Set(readdirSync(join(root, "tooling", "visual")).filter((f) => /^playwright\..*config\.ts$/.test(f))
    .flatMap((f) => [...readFileSync(join(root, "tooling", "visual", f), "utf8").matchAll(/localhost:(\d{4,5})/g)].map((m) => Number(m[1]))));
  for (const port of [...ports].sort()) {
    if (!(await listening(port))) continue;
    const pid = portOwner(port);
    if (!(await responds(port))) fail(`Cổng ${port} (PID ${pid}) có server không trả lời — tắt: ${windows ? `taskkill /F /T /PID ${pid}` : `kill ${pid}`} (tiến trình của sandbox Codex cần quyền admin)`);
    else warn(`Cổng ${port} (PID ${pid}) đang có server — Playwright sẽ dùng lại; không phải server của phiên này thì tắt đi`);
  }
  const lock = join(root, ".git", "index.lock");
  if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs > 60_000) fail("`.git/index.lock` tồn tại > 1 phút — không còn tiến trình git thì xóa file");
  if (existsSync(join(root, ".git", "rebase-merge")) || existsSync(join(root, ".git", "rebase-apply"))) fail("Đang dở rebase — `git rebase --continue|--abort|--quit`");
  for (const [level, text] of results) console.log(`${level} ${text}`);
  const blocking = results.filter(([level]) => level === "✘").length;
  console.log(blocking ? `DOCTOR FAIL · ${blocking} blocker` : `DOCTOR OK${results.length ? ` · ${results.length} cảnh báo` : ""}`);
  process.exit(blocking ? 1 : 0);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "run") {
  const sep = rest.indexOf("--"), idle = rest[rest.indexOf("--idle") + 1];
  if (sep < 0 || sep === rest.length - 1) { console.error("Dùng: doctor.mjs run [--idle <phút>] -- <lệnh…>"); process.exit(1); }
  run(rest.includes("--idle") ? Number(idle) : 10, rest.slice(sep + 1));
} else await check();
