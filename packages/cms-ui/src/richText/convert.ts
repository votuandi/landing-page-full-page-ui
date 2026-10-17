import type { Link, RichTextBlock, RichTextInline, RichTextText } from "@solar/sections";

/**
 * Editor richText tối giản soạn trên văn bản đánh dấu:
 * `**đậm**`, `*nghiêng*`, `[chữ](đích)`, dòng `- ` / `1. ` là danh sách, `## ` là tiêu đề, dòng trống ngăn đoạn.
 * Đích link: `/trang`, `https://…`, `#neo`, `tel:…`, `zalo:…`, `calculator:?…`. Chỉ sinh đúng whitelist của schema.
 */

const escapeText = (text: string) => text.replace(/[\\*[\]]/g, "\\$&");

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

function hrefLink(href: string, label: string): Link {
  const [, prefix = "", rest = href] = /^(\/|#|tel:|zalo:|calculator:)?([\s\S]*)$/.exec(href) ?? [];
  const kind = ({ "/": "page", "#": "anchor", "tel:": "phone", "zalo:": "zalo", "calculator:": "calculator" } as const)[prefix] ?? "url";
  return { kind, value: rest, label: { vi: label } };
}

const escapeHref = (href: string) => href.replace(/[\\()]/g, "\\$&");

const inlineToMarkup = (children: RichTextInline[]) => children.map((node) => node.type === "text"
  ? textToMarkup(node)
  : `[${node.children.map(textToMarkup).join("")}](${escapeHref(linkHref(node.link))})`).join("");

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

/** Link cũ (nhãn VI/EN riêng) được giữ nguyên khi đích và chữ hiển thị không đổi. */
type KnownLink = { href: string; text: string; link: Link };

/** Vị trí ký tự đóng khớp với ký tự mở tại `start`, bỏ qua ký tự thoát; -1 nếu không có trên cùng dòng. */
function closing(source: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === "\\") { i++; continue; }
    if (char === "\n") return -1;
    if (char === open) depth++;
    else if (char === close && --depth === 0) return i;
  }
  return -1;
}

const unescape = (text: string) => text.replace(/\\([\s\S])/g, "$1");

function parseInline(source: string, known: KnownLink[]): RichTextInline[] {
  const out: RichTextInline[] = [];
  let plain = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "\\") { plain += source.slice(i, i + 2); i++; continue; }
    const textEnd = char === "[" ? closing(source, i, "[", "]") : -1;
    const hrefEnd = textEnd > 0 && source[textEnd + 1] === "(" ? closing(source, textEnd + 1, "(", ")") : -1;
    if (hrefEnd < 0) { plain += char; continue; }
    out.push(...parseTexts(plain));
    plain = "";
    const children = parseTexts(source.slice(i + 1, textEnd));
    const href = unescape(source.slice(textEnd + 2, hrefEnd));
    const text = children.map((child) => child.text).join("");
    const reused = known.find((item) => item.href === href && item.text === text);
    out.push({ type: "link", link: reused?.link ?? hrefLink(href, text), children });
    i = hrefEnd;
  }
  out.push(...parseTexts(plain));
  return out;
}

function knownLinks(blocks: RichTextBlock[]): KnownLink[] {
  const inlines = blocks.flatMap((block) => (block.type === "list" ? block.items.flat() : block.children));
  return inlines.flatMap((node) => (node.type === "link"
    ? [{ href: linkHref(node.link), text: node.children.map((child) => child.text).join(""), link: node.link }]
    : []));
}

/** `previous`: dữ liệu trước khi sửa, để giữ metadata của link không đổi. */
export function markupToBlocks(markup: string, previous: RichTextBlock[] = []): RichTextBlock[] {
  const known = knownLinks(previous);
  const blocks: RichTextBlock[] = [];
  for (const chunk of markup.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;
    const heading = /^(#{2,4}) ([\s\S]*)$/.exec(lines[0]);
    if (heading && lines.length === 1) {
      blocks.push({ type: "heading", level: heading[1].length as 2 | 3 | 4, children: parseInline(heading[2], known) });
      continue;
    }
    const ordered = lines.every((line) => /^\d+\. /.test(line));
    if (ordered || lines.every((line) => line.startsWith("- "))) {
      blocks.push({ type: "list", ordered, items: lines.map((line) => parseInline(line.replace(/^(\d+\.|-) /, ""), known)) });
      continue;
    }
    blocks.push({ type: "paragraph", children: parseInline(lines.join("\n"), known) });
  }
  return blocks;
}
