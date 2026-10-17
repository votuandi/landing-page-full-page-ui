import type { Link, RichTextBlock, RichTextInline, RichTextText } from "@solar/sections";

/**
 * Editor richText tối giản soạn trên văn bản đánh dấu:
 * `**đậm**`, `*nghiêng*`, `[chữ](đích)`, dòng `- ` / `1. ` là danh sách, `## ` là tiêu đề, dòng trống ngăn đoạn.
 * Đích link: `/trang`, `https://…`, `#neo`, `tel:…`, `zalo:…`, `calculator:?…`. Chỉ sinh đúng whitelist của schema.
 * Nhãn link khác chữ hiển thị (hoặc có bản EN) đi kèm trong link dạng mảng JSON `[chữ](đích ["nhãn VI","nhãn EN"])` —
 * JSON giữ đúng mọi ký tự (`\`, `|`, xuống dòng) — nên sửa/xóa link khác không làm đổi metadata của link này.
 */

const escapeText = (text: string) => text.replace(/[\\*[\]]/g, "\\$&");
const escapeHref = (href: string) => href.replace(/[\\()"[\]]/g, "\\$&");
const unescape = (text: string) => text.replace(/\\([\s\S])/g, "$1");

function textToMarkup(node: RichTextText): string {
  const text = escapeText(node.text);
  if (!text) return "";
  const mark = node.bold && node.italic ? "***" : node.bold ? "**" : node.italic ? "*" : "";
  return `${mark}${text}${mark}`;
}

function linkHref(link: Link): string {
  switch (link.kind) {
    case "page": return `/${link.value}`;
    case "anchor": return `#${link.value}`;
    case "phone": return `tel:${link.value}`;
    case "zalo": return `zalo:${link.value}`;
    case "calculator": return `calculator:${link.value}`;
    default: return link.value;
  }
}

function hrefLink(href: string, label: Link["label"]): Link {
  const [, prefix = "", rest = href] = /^(\/|#|tel:|zalo:|calculator:)?([\s\S]*)$/.exec(href) ?? [];
  const kind = ({ "/": "page", "#": "anchor", "tel:": "phone", "zalo:": "zalo", "calculator:": "calculator" } as const)[prefix] ?? "url";
  return { kind, value: rest, label };
}

function linkToMarkup(node: Extract<RichTextInline, { type: "link" }>): string {
  const text = node.children.map((child) => child.text).join("");
  const { vi, en } = node.link.label;
  const title = vi === text && en === undefined ? "" : ` ${JSON.stringify(en === undefined ? [vi] : [vi, en])}`;
  return `[${node.children.map(textToMarkup).join("")}](${escapeHref(linkHref(node.link))}${title})`;
}

const inlineToMarkup = (children: RichTextInline[]) =>
  children.map((node) => (node.type === "text" ? textToMarkup(node) : linkToMarkup(node))).join("");

export function blocksToMarkup(blocks: RichTextBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "heading") return `${"#".repeat(block.level)} ${inlineToMarkup(block.children)}`;
    if (block.type === "list") return block.items.map((item, i) => `${block.ordered ? `${i + 1}.` : "-"} ${inlineToMarkup(item)}`).join("\n");
    const text = inlineToMarkup(block.children);
    // Dòng đầu trông như cú pháp khối thì thoát để không bị đọc thành tiêu đề/danh sách.
    return /^(#{2,4} |- |\d+\. )/.test(text) ? `\\${text}` : text;
  }).join("\n\n");
}

function parseTexts(source: string): RichTextText[] {
  const out: RichTextText[] = [];
  let bold = false;
  let italic = false;
  let buffer = "";
  const flush = () => {
    if (!buffer) return;
    const last = out.at(-1);
    if (last && !!last.bold === bold && !!last.italic === italic) last.text += buffer;
    else out.push({ type: "text", text: buffer, ...(bold ? { bold: true } : {}), ...(italic ? { italic: true } : {}) });
    buffer = "";
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "\\" && i + 1 < source.length) { buffer += source[++i]; continue; }
    if (char === "*") {
      flush();
      if (source[i + 1] === "*") { bold = !bold; i++; } else italic = !italic;
      continue;
    }
    buffer += char;
  }
  flush();
  return out;
}

/** Vị trí ký tự đóng khớp với ký tự mở tại `start`, bỏ qua ký tự thoát và chuỗi trong ngoặc kép; -1 nếu không có trên cùng dòng. */
function closing(source: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quoted = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === "\\") { i++; continue; }
    if (char === "\n") return -1;
    if (char === '"' && open === "(") quoted = !quoted;
    else if (quoted) continue;
    else if (char === open) depth++;
    else if (char === close && --depth === 0) return i;
  }
  return -1;
}

/** `đích ["vi","en"]` → đích + nhãn; không có nhãn (hoặc JSON hỏng) → nhãn = chữ hiển thị. */
function parseTarget(target: string, text: string): Link {
  const titled = /^([\s\S]*?) (\[[\s\S]*\])$/.exec(target);
  let label: unknown;
  try { label = titled ? JSON.parse(titled[2]) : undefined; } catch { label = undefined; }
  if (!titled || !Array.isArray(label) || label.length < 1 || label.length > 2 || !label.every((part) => typeof part === "string")) {
    return hrefLink(unescape(target), { vi: text });
  }
  const [vi, en] = label as string[];
  return hrefLink(unescape(titled[1]), en === undefined ? { vi } : { vi, en });
}

function parseInline(source: string): RichTextInline[] {
  const out: RichTextInline[] = [];
  let plain = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "\\") { plain += source.slice(i, i + 2); i++; continue; }
    const textEnd = char === "[" ? closing(source, i, "[", "]") : -1;
    const targetEnd = textEnd > 0 && source[textEnd + 1] === "(" ? closing(source, textEnd + 1, "(", ")") : -1;
    if (targetEnd < 0) { plain += char; continue; }
    out.push(...parseTexts(plain));
    plain = "";
    const children = parseTexts(source.slice(i + 1, textEnd));
    out.push({ type: "link", link: parseTarget(source.slice(textEnd + 2, targetEnd), children.map((child) => child.text).join("")), children });
    i = targetEnd;
  }
  out.push(...parseTexts(plain));
  return out;
}

export function markupToBlocks(markup: string): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  for (const chunk of markup.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;
    const heading = /^(#{2,4}) ([\s\S]*)$/.exec(lines[0]);
    if (heading && lines.length === 1) {
      blocks.push({ type: "heading", level: heading[1].length as 2 | 3 | 4, children: parseInline(heading[2]) });
      continue;
    }
    const ordered = lines.every((line) => /^\d+\. /.test(line));
    if (ordered || lines.every((line) => line.startsWith("- "))) {
      blocks.push({ type: "list", ordered, items: lines.map((line) => parseInline(line.replace(/^(\d+\.|-) /, ""))) });
      continue;
    }
    blocks.push({ type: "paragraph", children: parseInline(lines.join("\n")) });
  }
  return blocks;
}
