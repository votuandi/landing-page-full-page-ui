/**
 * Ảnh DEMO cho khối uy tín → public/images/trust/:
 *  - cert-<id>.svg      : logo/huy hiệu chứng chỉ (lưới logo)
 *  - cert-<id>-full.svg : bản xem lớn (mô phỏng giấy chứng nhận, có dấu "MẪU")
 *  - press-<id>.svg     : logo báo/tạp chí HƯ CẤU
 * Tên tổ chức/báo đều là dữ liệu mẫu, có chữ "MẪU" — thay bằng bản scan/logo thật khi bàn giao.
 * Chạy: node scripts/make-trust-images.js
 */
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "images", "trust");
fs.mkdirSync(out, { recursive: true });
const font = "Arial,Helvetica,sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const certs = [
  { id: "iso-9001", code: "ISO", line: "9001:2015", title: "HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG", color: "#1E3A8A" },
  { id: "an-toan-dien", code: "AT", line: "Điện", title: "CHỨNG CHỈ AN TOÀN ĐIỆN", color: "#B45309" },
  { id: "phan-phoi", code: "NPP", line: "Ủy quyền", title: "NHÀ PHÂN PHỐI ỦY QUYỀN", color: "#0F766E" },
  { id: "lap-dat", code: "PV", line: "Installer", title: "ĐỐI TÁC LẮP ĐẶT ĐƯỢC CHỨNG NHẬN", color: "#9A3412" },
  { id: "pccc", code: "PCCC", line: "Thi công", title: "ĐỦ ĐIỀU KIỆN THI CÔNG PCCC", color: "#B91C1C" },
];

const seal = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
<circle cx="120" cy="120" r="112" fill="#fff" stroke="${c.color}" stroke-width="8"/>
<circle cx="120" cy="120" r="92" fill="none" stroke="${c.color}" stroke-width="2" stroke-dasharray="4 6"/>
<text x="120" y="122" font-family="${font}" font-size="${c.code.length > 3 ? 44 : 56}" font-weight="900" fill="${c.color}" text-anchor="middle">${esc(c.code)}</text>
<text x="120" y="156" font-family="${font}" font-size="20" font-weight="700" fill="#44403C" text-anchor="middle">${esc(c.line)}</text>
<text x="120" y="190" font-family="${font}" font-size="14" font-weight="700" fill="#A8A29E" text-anchor="middle">MẪU</text>
</svg>`;

const doc = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1188" width="840" height="1188">
<rect width="840" height="1188" fill="#FFFDF8"/>
<rect x="36" y="36" width="768" height="1116" fill="none" stroke="${c.color}" stroke-width="10"/>
<rect x="58" y="58" width="724" height="1072" fill="none" stroke="${c.color}" stroke-width="2"/>
<text x="420" y="190" font-family="${font}" font-size="54" font-weight="900" fill="${c.color}" text-anchor="middle">GIẤY CHỨNG NHẬN</text>
<text x="420" y="250" font-family="${font}" font-size="26" font-weight="700" fill="#44403C" text-anchor="middle">${esc(c.title)}</text>
<text x="420" y="390" font-family="${font}" font-size="24" fill="#57534E" text-anchor="middle">Chứng nhận đơn vị</text>
<text x="420" y="450" font-family="${font}" font-size="40" font-weight="900" fill="#1C1917" text-anchor="middle">CÔNG TY TNHH MINWY SOLAR</text>
<text x="420" y="510" font-family="${font}" font-size="22" fill="#57534E" text-anchor="middle">đáp ứng các yêu cầu của tiêu chuẩn / chương trình nêu trên</text>
<g transform="translate(300 600)">${seal(c).replace(/<\/?svg[^>]*>/g, "")}</g>
<text x="200" y="1010" font-family="${font}" font-size="20" fill="#57534E" text-anchor="middle">Số: XXXX/MẪU</text>
<text x="640" y="1010" font-family="${font}" font-size="20" fill="#57534E" text-anchor="middle">Đơn vị cấp: [CẦN XÁC MINH]</text>
<text x="420" y="700" font-family="${font}" font-size="170" font-weight="900" fill="#B91C1C" opacity=".12" text-anchor="middle" transform="rotate(-24 420 700)">MẪU</text>
</svg>`;

const press = [
  { id: "nang-luong-xanh", name: "Năng Lượng Xanh", tag: "BÁO", color: "#15803D" },
  { id: "kinh-te-moi", name: "Kinh Tế Mới", tag: "TẠP CHÍ", color: "#1E3A8A" },
  { id: "doi-song-so", name: "Đời Sống Số", tag: "BÁO ĐIỆN TỬ", color: "#9A3412" },
  { id: "nha-nong", name: "Nhà Nông Ngày Nay", tag: "BÁO", color: "#B45309" },
];

const pressLogo = (p) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120">
<rect x="6" y="20" width="80" height="80" rx="18" fill="${p.color}"/>
<text x="46" y="76" font-family="${font}" font-size="48" font-weight="900" fill="#fff" text-anchor="middle">${esc(p.name[0])}</text>
<text x="104" y="52" font-family="${font}" font-size="14" font-weight="700" letter-spacing="3" fill="#78716C">${esc(p.tag)} · MẪU</text>
<text x="104" y="88" font-family="${font}" font-size="30" font-weight="900" fill="#1C1917"${p.name.length > 14 ? ' textLength="244" lengthAdjust="spacingAndGlyphs"' : ""}>${esc(p.name)}</text>
</svg>`;

for (const c of certs) {
  fs.writeFileSync(path.join(out, `cert-${c.id}.svg`), seal(c));
  fs.writeFileSync(path.join(out, `cert-${c.id}-full.svg`), doc(c));
}
for (const p of press) fs.writeFileSync(path.join(out, `press-${p.id}.svg`), pressLogo(p));
console.log(`${certs.length * 2 + press.length} ảnh → ${path.relative(process.cwd(), out)}`);
