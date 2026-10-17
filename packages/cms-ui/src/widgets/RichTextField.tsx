"use client";

import { useRef, useState } from "react";
import type { RichTextValue } from "@solar/sections";
import { blocksToMarkup, markupToBlocks } from "../richText/convert.ts";
import { issuesUnder } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { describedBy, FieldShell, inputClass, SmallButton } from "../ui.tsx";
import { fieldId } from "../fields/Field.tsx";
import { LocaleTabs, type Locale } from "./LocalizedField.tsx";

type Edit = (text: string, start: number, end: number) => { text: string; start: number; end: number };

const wrap = (mark: string, placeholder: string): Edit => (text, start, end) => {
  const selected = text.slice(start, end) || placeholder;
  return { text: text.slice(0, start) + mark + selected + mark + text.slice(end), start: start + mark.length, end: start + mark.length + selected.length };
};

const prefixLines = (prefix: (i: number) => string): Edit => (text, start, end) => {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const newline = text.indexOf("\n", end);
  const lineEnd = newline === -1 ? text.length : newline;
  const next = (text.slice(lineStart, lineEnd) || "Mục").split("\n")
    .map((line, i) => prefix(i) + line.replace(/^(\d+\. |- |#{2,4} )/, "")).join("\n");
  return { text: text.slice(0, lineStart) + next + text.slice(lineEnd), start: lineStart, end: lineStart + next.length };
};

const link: Edit = (text, start, end) => {
  const selected = text.slice(start, end) || "chữ liên kết";
  const inserted = `[${selected}](/)`;
  // Đặt con trỏ vào phần đích để người dùng gõ tiếp.
  return { text: text.slice(0, start) + inserted + text.slice(end), start: start + selected.length + 3, end: start + selected.length + 3 };
};

const TOOLS: { label: string; title: string; edit: Edit; className?: string }[] = [
  { label: "B", title: "Đậm (**chữ**)", edit: wrap("**", "chữ đậm"), className: "font-bold" },
  { label: "I", title: "Nghiêng (*chữ*)", edit: wrap("*", "chữ nghiêng"), className: "italic" },
  { label: "Liên kết", title: "Liên kết ([chữ](/trang), https://…, tel:…, zalo:…)", edit: link },
  { label: "• Danh sách", title: "Danh sách gạch đầu dòng", edit: prefixLines(() => "- ") },
  { label: "1. Danh sách", title: "Danh sách đánh số", edit: prefixLines((i) => `${i + 1}. `) },
  { label: "Tiêu đề", title: "Tiêu đề phụ (## )", edit: prefixLines(() => "## ") },
];

export function RichTextField({ node, path, value, label }: FieldProps<RichTextValue | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const [locale, setLocale] = useState<Locale>("vi");
  // Chỉ chuyển sang JSON khi người dùng sửa: dữ liệu chưa chạm giữ nguyên từng byte.
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  if (node.kind !== "widget") return null;
  const id = fieldId(idPrefix, path);
  const errors = issuesUnder(issues, path);
  const current = value ?? { vi: [] };
  const text = draft ?? blocksToMarkup((locale === "en" ? current.en : current.vi) ?? []);
  const hint = "Dòng trống ngăn đoạn · **đậm** · *nghiêng* · [chữ](/trang) · dòng bắt đầu bằng - hoặc 1. là danh sách";

  const commit = (markup: string) => {
    setDraft(markup);
    const blocks = markupToBlocks(markup);
    if (locale === "vi") update(path, { ...current, vi: blocks });
    else {
      const { en: _en, ...rest } = current;
      update(path, blocks.length ? { ...current, en: blocks } : rest);
    }
  };
  const apply = (edit: Edit) => {
    const area = ref.current;
    if (!area) return;
    const next = edit(text, area.selectionStart, area.selectionEnd);
    commit(next.text);
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(next.start, next.end); });
  };

  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}
      aside={<LocaleTabs id={id} locale={locale} onChange={(next) => { setLocale(next); setDraft(null); }} />}>
      <div className="overflow-hidden rounded-input border border-line/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
        <div role="toolbar" aria-label="Định dạng" aria-controls={id} className="flex flex-wrap gap-0.5 border-b border-line/15 bg-bg-tint px-1 py-1">
          {TOOLS.map((tool) => (
            <SmallButton key={tool.label} title={tool.title} aria-label={tool.title} className={tool.className} onClick={() => apply(tool.edit)}>
              {tool.label}
            </SmallButton>
          ))}
        </div>
        <textarea ref={ref} id={id} rows={8} value={text} onChange={(event) => commit(event.target.value)}
          aria-invalid={errors.length ? true : undefined} aria-describedby={describedBy(id, hint, errors)}
          className={`${inputClass} rounded-none border-0 font-mono text-sm leading-relaxed focus:ring-0`} />
      </div>
    </FieldShell>
  );
}
