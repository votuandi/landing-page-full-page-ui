"use client";

import type { Link } from "@solar/sections";
import { describe } from "../schema/describe.ts";
import { pathKey } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { describedBy, FieldShell, inputClass } from "../ui.tsx";
import { Field, fieldId } from "../fields/Field.tsx";

const KINDS: Record<Link["kind"], { label: string; value: string; placeholder: string; hint?: string }> = {
  page: { label: "Trang của site", value: "Trang", placeholder: "gioi-thieu", hint: "Để trống = trang chủ." },
  anchor: { label: "Neo trong trang", value: "Mã neo", placeholder: "bao-gia" },
  phone: { label: "Gọi điện", value: "Số điện thoại", placeholder: "0901 234 567" },
  zalo: { label: "Zalo", value: "Số Zalo", placeholder: "0901 234 567" },
  calculator: { label: "Mở dự toán", value: "Tham số điền sẵn", placeholder: "segment=household&bill=2000000", hint: "Để trống = mở dự toán không điền sẵn." },
  url: { label: "Trang ngoài (URL)", value: "Đường dẫn", placeholder: "https://…" },
};

export function LinkField({ node, path, value, label }: FieldProps<Link | undefined>) {
  const { idPrefix, issues, update, pickers } = useSchemaForm();
  if (node.kind !== "widget") return null;
  const current = value ?? { kind: "page", value: "", label: { vi: "" } };
  const shape = (node.schema as unknown as { shape: { kind: { options: Link["kind"][] }; label: never } }).shape;
  const kindId = fieldId(idPrefix, [...path, "kind"]);
  const valueId = fieldId(idPrefix, [...path, "value"]);
  const valueErrors = issues.get(pathKey([...path, "value"]));
  const meta = KINDS[current.kind];
  const pages = current.kind === "page" ? pickers.pages : undefined;
  const set = (patch: Partial<Link>) => update(path, { ...current, ...patch });
  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <FieldShell id={kindId} label="Khi bấm">
          <select id={kindId} value={current.kind} className={inputClass}
            onChange={(event) => {
              if (current.value && !window.confirm("Đổi loại liên kết sẽ xóa giá trị đang nhập. Tiếp tục?")) return;
              set({ kind: event.target.value as Link["kind"], value: "" });
            }}>
            {shape.kind.options.map((kind) => <option key={kind} value={kind}>{KINDS[kind].label}</option>)}
          </select>
        </FieldShell>
        <FieldShell id={valueId} label={meta.value} hint={meta.hint} errors={valueErrors}>
          {pages ? (
            <select id={valueId} value={current.value} className={inputClass} aria-invalid={valueErrors?.length ? true : undefined}
              aria-describedby={describedBy(valueId, meta.hint, valueErrors)}
              onChange={(event) => set({ value: event.target.value })}>
              {!pages.some((page) => page.slug === current.value) && <option value={current.value}>{current.value || "Trang chủ"}</option>}
              {pages.map((page) => <option key={page.slug} value={page.slug}>{page.label}</option>)}
            </select>
          ) : (
            <input id={valueId} type={current.kind === "phone" || current.kind === "zalo" ? "tel" : "text"} value={current.value}
              placeholder={meta.placeholder} className={inputClass} aria-invalid={valueErrors?.length ? true : undefined}
              aria-describedby={describedBy(valueId, meta.hint, valueErrors)} onChange={(event) => set({ value: event.target.value })} />
          )}
        </FieldShell>
      </div>
      <Field node={describe(shape.label)} path={[...path, "label"]} value={current.label} label="Chữ hiển thị" />
    </fieldset>
  );
}
