import { request } from "node:http";
import { request as secureRequest } from "node:https";
import { pathToFileURL } from "node:url";

export function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return { median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    p90: sorted[Math.ceil(sorted.length * 0.9) - 1] };
}

export function measure(url) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    // Match the curl content gate: an absent User-Agent bypasses Next's htmlLimitedBots and can time a streamed shell.
    const req = (new URL(url).protocol === "https:" ? secureRequest : request)(url, { headers: { "user-agent": "solar-ttfb", accept: "text/html" } }, (res) => {
      const elapsed = performance.now() - start;
      res.resume();
      if (res.statusCode !== 200) reject(new Error(`${url}: HTTP ${res.statusCode}`));
      else res.on("end", () => resolve(elapsed));
      res.on("error", reject);
    });
    req.setTimeout(30_000, () => req.destroy(new Error(`Timeout: ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const [a, b, flag, value] = process.argv.slice(2);
  const n = flag === "--n" ? Number(value) : 50;
  if (!a || !b || (flag && flag !== "--n") || !Number.isInteger(n) || n < 1) throw new Error("Usage: node ttfb.mjs <url-a> <url-b> [--n 50]");
  for (let i = 0; i < 5; i++) { await measure(a); await measure(b); }
  const left = [], right = [];
  // Alternate requests to reduce order bias; both use identical connection behavior.
  for (let i = 0; i < n; i++) { left.push(await measure(a)); right.push(await measure(b)); }
  const old = summarize(left), current = summarize(right);
  console.log(JSON.stringify({ n, a: { url: a, ...old }, b: { url: b, ...current },
    medianChangePercent: (current.median / old.median - 1) * 100,
    p90ChangePercent: (current.p90 / old.p90 - 1) * 100 }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
