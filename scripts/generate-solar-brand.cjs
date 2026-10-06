// Frontend assets only. Uses TypeScript + Sharp already installed with Next.
const fs = require("node:fs"),
  ts = require("typescript"),
  vm = require("node:vm"),
  sharp = require("sharp");
const moduleData = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/content/solar/data.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: moduleData, exports: moduleData.exports },
);
const brand = moduleData.exports.brand;
const escape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const primary = "#15803D",
  dark = "#14532D",
  accent = "#FACC15",
  white = "#FFFFFF";
const mark = (mono = false) =>
  `<g stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="25" r="13" fill="${mono ? white : accent}"/><path d="M26 5V1 M26 49V45 M6 25H2 M50 25H54 M12 11L9 8 M40 11L43 8 M12 39L9 42" stroke="${mono ? white : dark}" stroke-width="3"/><path d="M25 54C25 38 39 30 58 32C57 50 42 61 25 54Z" fill="${mono ? white : dark}"/><path d="M29 51L48 39" stroke="${mono ? dark : white}" stroke-width="2.5"/></g>`;
const wrap = (inner, width = 64) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 64"><title>${escape(brand.name)}</title>${inner}</svg>`;
const full = (inner, mono = false) =>
  wrap(
    inner +
      `<text x="72" y="39" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${mono ? white : dark}">${escape(brand.name)}</text>`,
    76 + brand.name.length * 13,
  );
const favicon = wrap(mark());
fs.mkdirSync("docs/logo-options", { recursive: true });
fs.writeFileSync("docs/logo-options/option-1.svg", full(mark()));
fs.writeFileSync(
  "docs/logo-options/option-2.svg",
  full(
    `<circle cx="30" cy="30" r="27" fill="${primary}"/><circle cx="29" cy="25" r="12" fill="${accent}"/><path d="M18 48C19 33 36 28 48 30C47 46 31 54 18 48Z" fill="${white}"/>`,
  ),
);
fs.writeFileSync(
  "docs/logo-options/option-3.svg",
  full(
    `<path d="M4 30L30 10L56 30" fill="none" stroke="${dark}" stroke-width="4"/><circle cx="44" cy="13" r="9" fill="${accent}"/><path d="M15 52C15 35 34 28 49 30C48 49 32 61 15 52Z" fill="${primary}"/><path d="M21 49L40 36" stroke="${white}" stroke-width="2.5"/>`,
  ),
);
fs.writeFileSync("public/logo-mark.svg", favicon);
fs.writeFileSync("public/logo-full.svg", full(mark()));
fs.writeFileSync("public/logo-white.svg", full(mark(true), true));
fs.writeFileSync("public/logo.svg", full(mark()));
fs.writeFileSync("public/favicon.svg", favicon);
(async () => {
  await sharp(Buffer.from(favicon))
    .resize(32, 32)
    .png()
    .toFile("public/favicon-32.png");
  const square = wrap(
    `<rect width="64" height="64" fill="${white}"/><g transform="translate(7 7) scale(.78)">${mark()}</g>`,
  );
  for (const [file, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ])
    await sharp(Buffer.from(square))
      .resize(size, size)
      .png()
      .toFile("public/" + file);
  const sizes = [16, 32, 48],
    images = await Promise.all(
      sizes.map((size) =>
        sharp(Buffer.from(favicon)).resize(size, size).png().toBuffer(),
      ),
    );
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((img, i) => {
    const at = 6 + i * 16;
    header[at] = sizes[i];
    header[at + 1] = sizes[i];
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(img.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += img.length;
  });
  fs.writeFileSync("public/favicon.ico", Buffer.concat([header, ...images]));
  fs.writeFileSync(
    "public/site.webmanifest",
    JSON.stringify(
      {
        name: brand.name,
        short_name: brand.name,
        start_url: "/",
        display: "standalone",
        background_color: white,
        theme_color: primary,
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Generated: 3 logo options, full/mark/white, favicon SVG/ICO 16/32/48, PNG 32/180/192/512, manifest.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
