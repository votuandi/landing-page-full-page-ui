// Sinh nhận diện demo từ cùng file nội dung. Không dùng logo thương hiệu thật.
const fs = require("node:fs");
const ts = require("typescript");
const source = ts.transpileModule(
  fs.readFileSync("src/content/site.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const mod = { exports: {} };
new Function("exports", "module", "require", source)(mod.exports, mod, require);
const { CLIENTS, ASSET_COPY } = mod.exports;
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
fs.mkdirSync("public/images/clients", { recursive: true });
for (const [i, c] of CLIENTS.entries()) {
  const icon =
    i % 3 === 0
      ? '<path d="M12 43V22l11 7V17l12 8V12h10v31z"/><path d="M18 35h3m8 0h3m8 0h3" stroke="white" stroke-width="3"/>'
      : i % 3 === 1
        ? '<path d="M27 46V25M27 35C11 35 7 18 12 14c10 0 15 9 15 16M27 28c0-13 10-21 20-19 1 13-6 23-20 23" fill="none" stroke="currentColor" stroke-width="4"/>'
        : '<path d="M10 30L28 13l18 17v17H13V30z"/><path d="M23 47V34h10v13" fill="white"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="72" viewBox="0 0 260 72" role="img"><title>${escape(ASSET_COPY.logoAltPrefix + " " + c.name)}</title><g color="${c.color}" fill="currentColor" transform="translate(0 8)">${icon}</g><text x="60" y="40" fill="${c.color}" font-family="Arial,sans-serif" font-size="${c.shortName.length > 13 ? 13 : 17}" font-weight="700">${escape(c.shortName)}</text></svg>`;
  fs.writeFileSync(`public/images/clients/${c.id}.svg`, svg);
}
console.log(`Generated ${CLIENTS.length} fictional SVG identities`);
