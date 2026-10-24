import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const types = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".webp": "image/webp", ".avif": "image/avif" };
const inside = (root, path) => { const rel = relative(root, path); return rel && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
function rangeOf(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || !size || (!match[1] && !match[2])) return null;
  const first = Number(match[1]), last = Number(match[2]);
  if (![first, last].every(Number.isSafeInteger)) return null;
  const start = match[1] ? first : Math.max(0, size - last);
  const end = match[1] && match[2] ? Math.min(last, size - 1) : size - 1;
  return start >= 0 && start < size && start <= end ? { start, end } : null;
}

/** Test-only equivalent of Caddy's public /media/tenants/* mount. */
export function createMediaServer(root) {
  return createServer(async (request, response) => {
    const finish = status => { response.writeHead(status); response.end(); };
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (!["GET", "HEAD"].includes(request.method)) { response.setHeader("Allow", "GET, HEAD"); finish(405); return; }
    if (request.url === "/media/tenants/health") { finish(204); return; }
    let key;
    try { key = decodeURIComponent((request.url ?? "").split("?")[0]).replace(/^\/media\//, ""); }
    catch { finish(403); return; }
    if (!key.startsWith("tenants/") || /[\\\u0000-\u0020%?#]/.test(key) || key.split("/").some(part => !part || part === "." || part === "..")) { finish(403); return; }
    try {
      const base = await realpath(root), path = await realpath(resolve(base, key));
      if (!inside(base, path)) { finish(403); return; }
      const info = await stat(path);
      if (!info.isFile()) { finish(404); return; }
      const range = request.headers.range ? rangeOf(request.headers.range, info.size) : undefined;
      if (range === null) { response.setHeader("Content-Range", `bytes */${info.size}`); finish(416); return; }
      response.setHeader("Accept-Ranges", "bytes");
      response.setHeader("Content-Type", types[extname(path)] ?? "application/octet-stream");
      response.setHeader("Content-Length", range ? range.end - range.start + 1 : info.size);
      if (range) response.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
      response.writeHead(range ? 206 : 200);
      if (request.method === "HEAD") { response.end(); return; }
      const stream = createReadStream(path, range);
      stream.on("error", () => response.destroy());
      response.on("close", () => stream.destroy());
      stream.pipe(response);
    } catch { finish(404); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.env.STORAGE_LOCAL_ROOT) throw Error("STORAGE_LOCAL_ROOT required");
  const server = createMediaServer(process.env.STORAGE_LOCAL_ROOT);
  server.listen(3212, "127.0.0.1");
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close());
}
