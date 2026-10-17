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

const inlineToMarkup = (children: RichTextInline[]) => children.map((node) => node.type === "text"
  ? textToMarkup(node)
  : `[${node.children.map(textToMarkup).join("")}](${linkHref(node.link)})`).join("");

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

function parseInline(source: string): RichTextInline[] {
  const out: RichTextInline[] = [];
  let rest = source;
  while (rest) {
    const match = /(?<!\\)\[((?:\\.|[^\]\\])*)\]\(([^)\s]*)\)/.exec(rest);
    if (!match) { out.push(...parseTexts(rest)); break; }
    out.push(...parseTexts(rest.slice(0, match.index)));
    const children = parseTexts(match[1]);
    out.push({ type: "link", link: hrefLink(match[2], children.map((child) => child.text).join("")), children });
    rest = rest.slice(match.index + match[0].length);
  }
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
