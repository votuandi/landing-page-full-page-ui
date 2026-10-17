"use client";

import { useEffect, useState } from "react";
import { defaultFor, unionIndex, type FieldNode } from "../schema/describe.ts";
import { humanize, optionLabel } from "../schema/labels.ts";
import { formatNumber, numberCodec } from "../schema/codecs.ts";
import { pathKey, type Path } from "../schema/path.ts";
import { useSchemaForm, type FieldProps, type WidgetComponent } from "../context.ts";
import { describedBy, Errors, FieldShell, inputClass, SmallButton } from "../ui.tsx";
import { ArrayField } from "./ArrayField.tsx";
import { LocalizedField } from "../widgets/LocalizedField.tsx";
import { MediaField } from "../widgets/MediaField.tsx";
import { LinkField } from "../widgets/LinkField.tsx";
import { RichTextField } from "../widgets/RichTextField.tsx";
import { CollectionQueryField } from "../widgets/CollectionQueryField.tsx";

const WIDGETS = {
  localized: LocalizedField, localizedTextarea: LocalizedField, media: MediaField, link: LinkField,
  richText: RichTextField, collectionQuery: CollectionQueryField,
};

export const fieldId = (prefix: string, path: Path) => `${prefix}-${pathKey(path) || "root"}`;
const patternOf = (path: Path) => path.map((part) => (typeof part === "number" ? "*" : part)).join(".");

/** Nhãn: override theo đường dẫn → bảng nhãn → tách camelCase. */
export function useLabel(path: Path, fallback: string): string {
  const { labels } = useSchemaForm();
  return labels[patternOf(path)] ?? fallback;
}

export function Field(props: FieldProps) {
  const { node, path, value } = props;
  const { widgets, update } = useSchemaForm();
  const label = useLabel(path, props.label);
  const override = widgets[patternOf(path)] ?? widgets[node.kind === "widget" ? node.widget : node.kind];
  const Component: WidgetComponent = override ?? (node.kind === "widget" ? WIDGETS[node.widget] : KINDS[node.kind]);

  // Trường tùy chọn kiểu nhóm (object/widget/mảng/union): công tắc thêm/bỏ thay vì ô trống.
  if (node.optional && value === undefined && isGroup(node)) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-input border border-dashed border-line/25 px-3 py-2">
        <span className="text-sm text-fg-muted">{label} <span className="text-fg-subtle">(không bắt buộc)</span></span>
        <SmallButton onClick={() => update(path, defaultFor({ ...node, optional: false }))}>+ Thêm</SmallButton>
      </div>
    );
  }
  const element = <Component {...props} label={label} />;
  if (!node.optional || !isGroup(node)) return element;
  return (
    <div className="space-y-1">
      {element}
      <div className="flex justify-end">
        <SmallButton tone="danger" className="text-xs" onClick={() => update(path, undefined)}>Bỏ {label.toLowerCase()}</SmallButton>
      </div>
    </div>
  );
}

const isGroup = (node: FieldNode) => ["object", "widget", "array", "union", "record"].includes(node.kind);

function StringField({ node, path, value, label }: FieldProps<string | undefined | null>) {
  const { idPrefix, issues, update } = useSchemaForm();
  if (node.kind !== "string") return null;
  const id = fieldId(idPrefix, path);
  const errors = issues.get(pathKey(path));
  const text = value ?? "";
  const multiline = node.multiline || (node.max ?? 0) > 160;
  const common = {
    id, value: text, maxLength: node.max, "aria-invalid": errors?.length ? true : undefined,
    "aria-describedby": describedBy(id, undefined, errors), className: inputClass,
    onChange: (event: { target: { value: string } }) => update(path, event.target.value),
  };
  return (
    <FieldShell id={id} label={label} errors={errors}
      aside={node.max ? <span className="text-xs tabular-nums text-fg-subtle">{text.length}/{node.max}</span> : undefined}>
      {multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
    </FieldShell>
  );
}

function NumberField({ node, path, value, label }: FieldProps<number | null | undefined>) {
  const { idPrefix, issues, update, setInputError } = useSchemaForm();
  const [draft, setDraft] = useState<string | null>(null);
  const [inputError, setLocalError] = useState<string | null>(null);
  const key = pathKey(path);
  useEffect(() => () => setInputError(key, null), [key, setInputError]);
  if (node.kind !== "number") return null;
  const codec = numberCodec(node.nullable ? "null" : node.optional ? "undefined" : undefined);
  const id = fieldId(idPrefix, path);
  const errors = inputError ? [inputError] : issues.get(key);
  // Giới hạn kỹ thuật (0 < x ≤ 10^12) không giúp người nhập; chỉ nêu khoảng có ý nghĩa.
  const max = node.max !== undefined && node.max < 1e9 ? node.max : undefined;
  const min = node.min !== undefined && (node.min !== 0 || max !== undefined) ? node.min : undefined;
  const range = [min !== undefined && `từ ${formatNumber(min)}`, max !== undefined && `đến ${formatNumber(max)}`].filter(Boolean).join(" ");
  const hint = [node.int && "Số nguyên", range, node.nullable && "Để trống = không giới hạn"].filter(Boolean).join(" · ") || undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}>
      <input id={id} type="text" inputMode={node.int ? "numeric" : "decimal"} autoComplete="off"
        value={draft ?? codec.toInput(value)} aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, hint, errors)} className={`${inputClass} tabular-nums`}
        onChange={(event) => {
          const input = event.target.value;
          setDraft(input);
          const decoded = codec.fromInput(input);
          // Sai kiểu: giữ chữ người dùng gõ trong ô, không ghi vào dữ liệu.
          setLocalError(decoded.ok ? null : decoded.message);
          setInputError(key, decoded.ok ? null : decoded.message);
          if (decoded.ok) update(path, decoded.value);
        }}
        onBlur={() => { if (!inputError) setDraft(null); }} />
    </FieldShell>
  );
}

function BooleanField({ path, value, label }: FieldProps<boolean | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const id = fieldId(idPrefix, path);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg">{label}</span>
        <input id={id} type="checkbox" role="switch" checked={value === true}
          onChange={(event) => update(path, event.target.checked)}
          className="peer sr-only" />
        <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-pill bg-line/25 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-pill after:bg-bg after:shadow-card after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 motion-reduce:transition-none motion-reduce:after:transition-none" />
      </label>
      <Errors errors={issues.get(pathKey(path))} />
    </div>
  );
}

function EnumField({ node, path, value, label }: FieldProps<string | number | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  if (node.kind !== "enum") return null;
  const id = fieldId(idPrefix, path);
  const errors = issues.get(pathKey(path));
  if (node.options.length === 1 && !node.optional) return null; // literal cố định (vd. thẻ của union): không cần sửa
  return (
    <FieldShell id={id} label={label} errors={errors}>
      <select id={id} value={value === undefined ? "" : String(value)} className={inputClass}
        aria-invalid={errors?.length ? true : undefined}
        onChange={(event) => {
          const picked = node.options.find((option) => String(option) === event.target.value);
          update(path, picked);
        }}>
        {node.optional && <option value="">— Không chọn —</option>}
        {node.options.map((option) => <option key={String(option)} value={String(option)}>{humanize(String(option))}</option>)}
      </select>
    </FieldShell>
  );
}

/** `bare`: chỉ các trường con, không khung (dùng trong phần tử mảng/nhánh union đã có khung). */
export function ObjectField({ node, path, value, label, bare }: FieldProps<Record<string, unknown> | undefined> & { bare?: boolean }) {
  const { issues } = useSchemaForm();
  if (node.kind !== "object") return null;
  // Nhóm toàn ô ngắn (số, bật/tắt, lựa chọn) xếp hai cột cho gọn.
  const compact = node.fields.length > 1 && node.fields.every(({ node: child }) => ["number", "boolean", "enum"].includes(child.kind));
  const body = (
    <div className="space-y-5">
      <Errors errors={issues.get(pathKey(path))} />
      <div className={compact ? "grid gap-x-4 gap-y-5 sm:grid-cols-2" : "space-y-5"}>
        {node.fields.map((field) => (
          <Field key={field.key} node={field.node} path={[...path, field.key]} value={value?.[field.key]} label={humanize(field.key)} />
        ))}
      </div>
    </div>
  );
  if (bare || path.length === 0) return body;
  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      {body}
    </fieldset>
  );
}

/** Record khóa enum (vd. theo phân khúc, theo vùng): mỗi khóa một hàng. */
function RecordField({ node, path, value, label }: FieldProps<Record<string, unknown> | undefined>) {
  const { issues } = useSchemaForm();
  if (node.kind !== "record") return null;
  const flat = node.value.kind === "number" || node.value.kind === "string" || node.value.kind === "enum";
  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <Errors errors={issues.get(pathKey(path))} />
      <div className={flat ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {node.keys.map((key) => (
          <Field key={key} node={node.value} path={[...path, key]} value={value?.[key]} label={humanize(key)} />
        ))}
      </div>
    </fieldset>
  );
}

function UnionField({ node, path, value, label }: FieldProps) {
  const { idPrefix, issues, update } = useSchemaForm();
  if (node.kind !== "union") return null;
  const index = unionIndex(node, value);
  const option = node.options[index];
  const id = fieldId(idPrefix, [...path, "$branch"]);
  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-line/15 p-3 sm:p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <FieldShell id={id} label="Dạng">
        <select id={id} value={String(index)} className={inputClass}
          onChange={(event) => {
            const next = node.options[Number(event.target.value)];
            if (value !== undefined && !window.confirm("Đổi dạng sẽ xóa dữ liệu đang nhập ở trường này. Tiếp tục?")) return;
            update(path, defaultFor(next.node));
          }}>
          {node.options.map((item, i) => <option key={item.value} value={i}>{optionLabel(item, Boolean(node.discriminator))}</option>)}
        </select>
      </FieldShell>
      <Errors errors={issues.get(pathKey(path))} />
      {option.node.kind === "object"
        ? <ObjectField bare node={option.node} path={path} value={value as Record<string, unknown>} label={label} />
        : <Field node={option.node} path={path} value={value} label={label} />}
    </fieldset>
  );
}

function JsonField({ path, value, label }: FieldProps) {
  const { idPrefix } = useSchemaForm();
  const id = fieldId(idPrefix, path);
  return (
    <FieldShell id={id} label={label} hint="Kiểu dữ liệu này chưa có ô nhập riêng; chỉ xem.">
      <pre id={id} className="overflow-x-auto rounded-input bg-bg-tint p-3 text-xs text-fg-muted">{JSON.stringify(value, null, 2)}</pre>
    </FieldShell>
  );
}

const KINDS = {
  string: StringField, number: NumberField, boolean: BooleanField, enum: EnumField, object: ObjectField,
  record: RecordField, array: ArrayField, union: UnionField, json: JsonField,
};
