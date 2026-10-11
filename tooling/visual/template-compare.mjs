import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export function options(args) {
  const [id, ...rest] = args;
  if (!id || !/^(t\d+|minwy)$/.test(id) || rest.length % 2) throw new Error("Usage: node template-compare.mjs <presetId> [--port 4100] [--out <dir>] [--app http://localhost:3000]");
  const result = { id, port: 4100, out: join(root, "roadmap/evidence/E4", id), app: "http://localhost:3000" };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (!["--port", "--out", "--app"].includes(key) || !rest[i + 1]) throw new Error(`Invalid option: ${key}`);
    result[key.slice(2)] = key === "--port" ? Number(rest[i + 1]) : rest[i + 1];
  }
  if (!Number.isInteger(result.port) || result.port < 1024 || result.port > 65535) throw new Error("Invalid port");
  if (!["http:", "https:"].includes(new URL(result.app).protocol)) throw new Error("Invalid app URL");
  return result;
}
function run(command, args, cwd, shell = false) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", windowsHide: true, shell });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited ${code}`)));
  });
}
async function ready(url, child) {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error("Template server stopped before becoming ready");
    try { if ((await fetch(url, { signal: AbortSignal.timeout(5000) })).ok) return; } catch { /* Starting. */ }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`Server timeout: ${url}`);
}
async function main() {
  const opts = options(process.argv.slice(2));
  const preset = JSON.parse(readFileSync(join(root, "packages/presets", `${opts.id}.json`), "utf8"));
  const branch = preset.source.branch;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(branch)) throw new Error("Invalid source branch");
  const worktree = resolve(root, "../.solar-template-worktrees", branch);
  if (!existsSync(worktree)) await run("git", ["worktree", "add", "--detach", worktree, `origin/${branch}`], root);
  await run("git", ["diff", "--exit-code", `origin/${branch}`, "--"], worktree);
  // Ignored demo media is absent from a fresh worktree; both captures use the same local assets.
  mkdirSync(join(worktree, "public"), { recursive: true });
  for (const dir of ["images", "videos", "news", "products"]) {
    const source = join(root, "apps/web/public", dir), target = join(worktree, "public", dir);
    if (existsSync(source) && !existsSync(target)) symlinkSync(source, target, "junction");
  }
  const pm = existsSync(join(worktree, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(worktree, "yarn.lock")) ? "yarn" : "npm";
  const install = pm === "npm" ? ["ci"] : ["install", "--frozen-lockfile"];
  // Windows shell is only used for fixed package-manager install commands, never user arguments.
  await run(pm, install, worktree, process.platform === "win32");
  const require = createRequire(join(worktree, "package.json"));
  const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-p", String(opts.port)], {
    cwd: worktree, stdio: "inherit", windowsHide: true,
  });
  let browser;
  try {
    await ready(`http://localhost:${opts.port}`, server);
    browser = await chromium.launch();
    mkdirSync(opts.out, { recursive: true });
    let total = 0;
    const shots = [];
    for (const width of [390, 1440]) {
      for (const [name, url] of [["before", `http://localhost:${opts.port}/`], ["after", `${opts.app.replace(/\/$/, "")}/lab/presets/${opts.id}`]]) {
        const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "reduce", locale: "vi-VN", deviceScaleFactor: 1 });
        await context.addInitScript(() => { localStorage.setItem("t15-theme", "light"); sessionStorage.setItem("t15-consult-shown", "1"); });
        const page = await context.newPage();
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
        if (response?.status() !== 200) throw new Error(`Cannot capture ${url}: ${response?.status()}`);
        await page.addStyleTag({ content: "section, footer { content-visibility: visible !important; } *, *::before, *::after { animation: none !important; transition: none !important; }" });
        await page.evaluate(async () => {
          await document.fonts.ready;
          document.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });
          for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((done) => setTimeout(done, 30)); }
          window.scrollTo(0, 0);
        });
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        const path = resolve(opts.out, `${name}-${width}.jpg`);
        await page.screenshot({ path, fullPage: true, type: "jpeg", quality: 45, animations: "disabled" });
        total += statSync(path).size;
        shots.push({ page, path });
      }
    }
    for (const quality of [30, 15, 8]) {
      if (total <= 3_000_000) break;
      total = 0;
      for (const { page, path } of shots) {
        await page.screenshot({ path, fullPage: true, type: "jpeg", quality, animations: "disabled" });
        total += statSync(path).size;
      }
    }
    console.log(`${opts.id}: ${total} bytes (${(total / 1024 / 1024).toFixed(2)} MB), ${resolve(opts.out)}`);
  } finally {
    await browser?.close();
    if (server.exitCode === null) {
      if (process.platform === "win32") await run("taskkill", ["/pid", String(server.pid), "/t", "/f"], root);
      else server.kill("SIGTERM");
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
