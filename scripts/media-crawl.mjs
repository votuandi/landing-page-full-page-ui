import { pathToFileURL } from "node:url";

const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  const code = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
  return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
});

export function mediaUrls(html, base) {
  const urls = new Set();
  for (const tag of html.matchAll(/<(?:img|source|video|audio)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\s(srcset|src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const value = decode(attr[2] ?? attr[3] ?? attr[4]);
      const values = attr[1].toLowerCase() === "srcset" ? value.split(/,\s*/).map(part => part.trim().split(/\s+/)[0]) : [value];
      for (const item of values) {
        if (!item || /^(?:data|blob):/i.test(item)) continue;
        try { const url = new URL(item, base); if (["http:", "https:"].includes(url.protocol)) urls.add(url.href); } catch { urls.add(item); }
      }
    }
  }
  return [...urls];
}

export async function crawlMedia(pages) {
  const urls = new Set(), failures = [];
  for (const page of pages) {
    try {
      const response = await fetch(page, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) { failures.push({ url: page, status: response.status }); continue; }
      for (const url of mediaUrls(await response.text(), response.url)) urls.add(url);
    } catch { failures.push({ url: page, status: "network" }); }
  }
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
      if (!response.ok) failures.push({ url, status: response.status });
    } catch { failures.push({ url, status: "network" }); }
  }
  return { checked: urls.size, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pages = process.argv.slice(2);
  if (!pages.length) { console.error("Dùng: node scripts/media-crawl.mjs <url>…"); process.exitCode = 1; }
  else { const result = await crawlMedia(pages); console.log(JSON.stringify(result)); if (result.failures.length) process.exitCode = 1; }
}
