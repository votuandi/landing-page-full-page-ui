/**
 * Tạo ảnh minh họa sản phẩm DEMO (SVG, không logo thương hiệu) vào public/images/catalog/.
 * Chạy: node scripts/make-catalog-images.js — thay bằng ảnh sản phẩm thật khi bàn giao.
 * Màu trong file ảnh là màu của chính hình minh họa (tài sản tĩnh), không phải màu giao diện.
 */
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "images", "catalog");
fs.mkdirSync(out, { recursive: true });

const BG = "#EEF7F1";
const frame = (body, accent = "#15803D") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<rect width="600" height="600" fill="${BG}"/>
<circle cx="470" cy="120" r="70" fill="#FACC15" opacity=".35"/>
<ellipse cx="300" cy="520" rx="200" ry="22" fill="#0F261E" opacity=".08"/>
${body.replace(/ACCENT/g, accent)}
</svg>`;

const cells = (x, y, cols, rows, w, h, gap, fill) => {
  let s = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${x + c * (w + gap)}" y="${y + r * (h + gap)}" width="${w}" height="${h}" rx="3" fill="${fill}"/>`;
  return s;
};

const panel = (fill, cellFill, label) => frame(`
<g transform="translate(300 300) rotate(-8) translate(-150 -210)">
  <rect width="300" height="420" rx="10" fill="#E7E5E4" stroke="#A8A29E" stroke-width="6"/>
  <rect x="14" y="14" width="272" height="392" rx="4" fill="${fill}"/>
  ${cells(20, 20, 6, 10, 39, 34, 5.5, cellFill)}
</g>
<rect x="60" y="470" width="150" height="44" rx="22" fill="ACCENT"/><text x="135" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const inverter = (label, screen = "#0F766E") => frame(`
<rect x="170" y="120" width="260" height="340" rx="26" fill="#FAFAF9" stroke="#D6D3D1" stroke-width="6"/>
<rect x="170" y="400" width="260" height="60" rx="0" fill="#E7E5E4"/>
<rect x="210" y="170" width="180" height="96" rx="12" fill="#1C1917"/>
<rect x="224" y="184" width="152" height="68" rx="6" fill="${screen}"/>
<polyline points="234,236 262,214 290,226 318,196 346,206 366,190" fill="none" stroke="#FDBA74" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="230" cy="306" r="9" fill="#15803D"/><circle cx="262" cy="306" r="9" fill="#F59E0B"/><circle cx="294" cy="306" r="9" fill="#D6D3D1"/>
${cells(210, 340, 9, 1, 12, 40, 8, "#D6D3D1")}
<rect x="200" y="470" width="30" height="40" rx="6" fill="#57534E"/><rect x="370" y="470" width="30" height="40" rx="6" fill="#57534E"/>
<rect x="60" y="470" width="120" height="44" rx="22" fill="ACCENT"/><text x="120" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const battery = (label, modules) => frame(`
${Array.from({ length: modules }, (_, i) => `<g transform="translate(180 ${380 - i * 110})">
  <rect width="240" height="100" rx="18" fill="#FAFAF9" stroke="#D6D3D1" stroke-width="6"/>
  <rect x="20" y="30" width="110" height="40" rx="8" fill="#E7E5E4"/>
  <rect x="26" y="36" width="${30 + i * 22}" height="28" rx="5" fill="#15803D"/>
  <circle cx="190" cy="50" r="12" fill="ACCENT"/>
</g>`).join("")}
<rect x="60" y="470" width="120" height="44" rx="22" fill="ACCENT"/><text x="120" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`, "#0369A1");

const flood = (label, w) => frame(`
<rect x="285" y="380" width="30" height="110" rx="8" fill="#57534E"/>
<rect x="${300 - w / 2}" y="200" width="${w}" height="${w * 0.72}" rx="20" fill="#44403C"/>
<rect x="${300 - w / 2 + 16}" y="216" width="${w - 32}" height="${w * 0.72 - 32}" rx="10" fill="#FEF3C7"/>
${cells(300 - w / 2 + 30, 232, Math.floor((w - 60) / 26), Math.floor((w * 0.72 - 64) / 26), 18, 18, 8, "#FCD34D")}
<path d="M${300 - w / 2} ${200 + w * 0.36} L${300 - w / 2 - 70} ${200 + w * 0.36 - 60} M${300 + w / 2} ${200 + w * 0.36} L${300 + w / 2 + 70} ${200 + w * 0.36 - 60}" stroke="#F59E0B" stroke-width="8" stroke-linecap="round" opacity=".6"/>
<g transform="translate(90 120) rotate(-12)"><rect width="150" height="96" rx="8" fill="#1E3A8A"/>${cells(8, 8, 4, 3, 30, 22, 4.5, "#3B82F6")}</g>
<path d="M180 230 Q 230 330 285 400" fill="none" stroke="#1C1917" stroke-width="5"/>
<rect x="360" y="470" width="180" height="44" rx="22" fill="ACCENT"/><text x="450" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const street = (label) => frame(`
<rect x="288" y="200" width="24" height="300" rx="8" fill="#57534E"/>
<path d="M300 210 Q 300 150 380 150 L 470 150" fill="none" stroke="#57534E" stroke-width="18" stroke-linecap="round"/>
<rect x="400" y="140" width="130" height="36" rx="12" fill="#44403C"/><rect x="410" y="168" width="110" height="14" rx="6" fill="#FCD34D"/>
<path d="M410 190 L380 330 L560 330 L520 190 Z" fill="#FDE68A" opacity=".45"/>
<g transform="translate(110 120) rotate(-14)"><rect width="170" height="104" rx="8" fill="#1E3A8A"/>${cells(8, 8, 5, 3, 26, 24, 6, "#3B82F6")}</g>
<rect x="60" y="470" width="180" height="44" rx="22" fill="ACCENT"/><text x="150" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const garden = (label) => frame(`
${[200, 300, 400].map((x, i) => `<g transform="translate(${x} ${250 + (i % 2) * 30})">
  <rect x="-10" y="60" width="20" height="170" rx="6" fill="#57534E"/>
  <path d="M-46 60 L46 60 L30 0 L-30 0 Z" fill="#FDE68A"/><rect x="-40" y="-14" width="80" height="18" rx="6" fill="#1E3A8A"/>
  <circle cx="0" cy="34" r="16" fill="#FCD34D"/>
</g>`).join("")}
<rect x="60" y="470" width="190" height="44" rx="22" fill="ACCENT"/><text x="155" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const connector = (label) => frame(`
<path d="M120 380 C 220 250, 260 420, 360 300 S 480 260, 520 220" fill="none" stroke="#1C1917" stroke-width="14" stroke-linecap="round"/>
<path d="M120 420 C 220 300, 280 470, 380 340 S 490 300, 530 270" fill="none" stroke="#B91C1C" stroke-width="14" stroke-linecap="round"/>
<g transform="translate(150 200) rotate(-25)"><rect width="150" height="44" rx="14" fill="#1C1917"/><rect x="150" y="10" width="40" height="24" rx="6" fill="#A8A29E"/></g>
<g transform="translate(330 380) rotate(-25)"><rect width="150" height="44" rx="14" fill="#1C1917"/><rect x="-40" y="10" width="40" height="24" rx="6" fill="#A8A29E"/></g>
<rect x="60" y="470" width="160" height="44" rx="22" fill="ACCENT"/><text x="140" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const rail = (label) => frame(`
${[0, 1, 2].map((i) => `<g transform="translate(110 ${170 + i * 90}) skewX(-20)"><rect width="380" height="34" rx="6" fill="#D6D3D1" stroke="#A8A29E" stroke-width="4"/><rect x="0" y="12" width="380" height="8" fill="#A8A29E"/></g>`).join("")}
${[180, 330, 450].map((x) => `<rect x="${x}" y="150" width="22" height="70" rx="6" fill="#57534E"/>`).join("")}
<rect x="60" y="470" width="190" height="44" rx="22" fill="ACCENT"/><text x="155" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const allinone = (label) => frame(`
<rect x="190" y="90" width="220" height="380" rx="30" fill="#FFFFFF" stroke="#CFE3D6" stroke-width="6"/>
<rect x="222" y="130" width="156" height="80" rx="12" fill="#0F261E"/>
<rect x="234" y="142" width="132" height="56" rx="6" fill="#0369A1"/>
<polyline points="244,186 268,166 292,176 316,150 340,160 356,146" fill="none" stroke="#FACC15" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
${[0, 1, 2].map((i) => `<rect x="222" y="${236 + i * 70}" width="156" height="56" rx="12" fill="#E3F1E8"/><rect x="232" y="${250 + i * 70}" width="${70 + i * 18}" height="28" rx="6" fill="#16A34A"/>`).join("")}
<rect x="60" y="470" width="170" height="44" rx="22" fill="ACCENT"/><text x="145" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);

const bess = (label) => frame(`
<rect x="110" y="150" width="380" height="300" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="6"/>
${[0, 1, 2, 3].map((i) => `<rect x="${130 + i * 88}" y="175" width="76" height="250" rx="8" fill="#E2E8F0"/><rect x="${142 + i * 88}" y="195" width="52" height="10" rx="4" fill="#94A3B8"/><circle cx="${168 + i * 88}" cy="395" r="9" fill="${i === 3 ? "#FACC15" : "#16A34A"}"/>`).join("")}
<rect x="110" y="120" width="380" height="36" rx="10" fill="#0369A1"/>
<path d="M300 128 l-14 16 h12 l-6 14 l20 -20 h-12 l6 -10 z" fill="#FACC15"/>
<rect x="60" y="470" width="120" height="44" rx="22" fill="ACCENT"/><text x="120" y="499" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`, "#0369A1");

const files = {
  "panel-ntype.svg": panel("#1E293B", "#334155", "N-type"),
  "panel-mono.svg": panel("#1E3A8A", "#2563EB", "Mono"),
  "panel-bifacial.svg": panel("#0F172A", "#1E40AF", "2 mặt"),
  "inverter-grid.svg": inverter("Hòa lưới"),
  "inverter-hybrid.svg": inverter("Hybrid", "#0369A1"),
  "inverter-3phase.svg": inverter("3 pha", "#1E3A8A"),
  "battery-5.svg": battery("5 kWh", 1),
  "battery-10.svg": battery("10 kWh", 2),
  "battery-15.svg": battery("15 kWh", 3),
  "light-flood-100.svg": flood("Đèn pha", 150),
  "light-flood-300.svg": flood("Đèn pha", 210),
  "light-street.svg": street("Đèn đường"),
  "light-garden.svg": garden("Sân vườn"),
  "acc-mc4.svg": connector("Cáp &amp; MC4"),
  "acc-rail.svg": rail("Khung nhôm"),
  "allinone-8.svg": allinone("All-in-one"),
  "bess-215.svg": bess("BESS"),
};

for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(out, name), svg.replace(/\n\s*/g, "\n"));
console.log(`${Object.keys(files).length} ảnh → ${path.relative(process.cwd(), out)}`);
