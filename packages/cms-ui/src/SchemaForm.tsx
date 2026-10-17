"use client";

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { describe } from "./schema/describe.ts";
import { formatNumber } from "./schema/codecs.ts";
import { issuesByPath, setAt, type Path } from "./schema/path.ts";
import { SchemaFormContext, type FormContext, type Pickers, type WidgetComponent } from "./context.ts";
import { ObjectField, Field } from "./fields/Field.tsx";
import { Errors } from "./ui.tsx";

const vi = z.locales.vi().localeError;
const TYPES: Record<string, string> = { number: "số", string: "chữ", boolean: "bật/tắt", array: "danh sách", object: "nhóm trường" };
const fmt = (value: unknown) => (typeof value === "number" ? formatNumber(value) : String(value));

/** Câu ngắn cho người không rành kỹ thuật; dạng hiếm dùng bản dịch sẵn của zod. */
export const viError: z.core.$ZodErrorMap = (issue) => {
  const limit = (issue as { maximum?: unknown; minimum?: unknown; inclusive?: boolean; origin?: string });
  switch (issue.code) {
    case "too_big":
      if (limit.origin === "string") return `Tối đa ${fmt(limit.maximum)} ký tự`;
      if (limit.origin === "array") return `Tối đa ${fmt(limit.maximum)} mục`;
      return limit.inclusive === false ? `Phải nhỏ hơn ${fmt(limit.maximum)}` : `Tối đa ${fmt(limit.maximum)}`;
    case "too_small":
      if (limit.origin === "string") return Number(limit.minimum) <= 1 ? "Không được để trống" : `Tối thiểu ${fmt(limit.minimum)} ký tự`;
      if (limit.origin === "array") return `Cần ít nhất ${fmt(limit.minimum)} mục`;
      return limit.inclusive === false ? `Phải lớn hơn ${fmt(limit.minimum)}` : `Tối thiểu ${fmt(limit.minimum)}`;
    case "invalid_type": return `Cần nhập ${TYPES[issue.expected] ?? "đúng kiểu"}`;
    case "invalid_value": return "Giá trị không nằm trong danh sách cho phép";
    case "invalid_format": return issue.format === "url" ? "Đường dẫn không hợp lệ" : "Sai định dạng";
    case "not_multiple_of": return "Phải là số nguyên";
    default: return vi(issue);
  }
};

/** Validate bằng chính schema, thông báo tiếng Việt (message riêng trong schema được giữ nguyên). */
export function validate<S extends z.ZodType>(schema: S, value: unknown) {
  return schema.safeParse(value, { error: viError });
}

export type SchemaFormProps<S extends z.ZodType> = {
  schema: S;
  value: z.input<S>;
  onChange(next: z.input<S>): void;
  /** Chỉ gọi khi dữ liệu hợp lệ; nhận output của `schema.parse`. */
  onSubmit?(data: z.output<S>): void;
  submitLabel?: string;
  bilingual?: boolean;
  pickers?: Pickers;
  widgets?: Partial<Record<string, WidgetComponent>>;
  labels?: Partial<Record<string, string>>;
};

const NO_PICKERS: Pickers = {};
const NO_OVERRIDES = {};

export function SchemaForm<S extends z.ZodType>({
  schema, value, onChange, onSubmit, submitLabel = "Lưu", bilingual = false,
  pickers = NO_PICKERS, widgets = NO_OVERRIDES, labels = NO_OVERRIDES,
}: SchemaFormProps<S>) {
  const idPrefix = useId();
  const node = useMemo(() => describe(schema), [schema]);
  const result = useMemo(() => validate(schema, value), [schema, value]);
  const issues = useMemo(() => issuesByPath(result.error), [result]);
  const [inputErrors, setInputErrors] = useState<ReadonlySet<string>>(new Set());
  // Bản mới nhất cho nhiều lần sửa liên tiếp trước khi parent render lại.
  const latest = useRef(value);
  useLayoutEffect(() => { latest.current = value; }, [value]);

  const update = useCallback((path: Path, next: unknown) => {
    latest.current = setAt(latest.current, path, next);
    onChange(latest.current);
  }, [onChange]);
  const setInputError = useCallback((key: string, message: string | null) => {
    setInputErrors((prev) => {
      if (prev.has(key) === Boolean(message)) return prev;
      const next = new Set(prev);
      if (message) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const ctx = useMemo<FormContext>(() => ({ idPrefix, issues, bilingual, pickers, widgets, labels, update, setInputError, inputErrorKeys: inputErrors }),
    [idPrefix, issues, bilingual, pickers, widgets, labels, update, setInputError, inputErrors]);
  const invalid = !result.success || inputErrors.size > 0;
  const errorCount = (result.error?.issues.length ?? 0) + inputErrors.size;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (result.success && inputErrors.size === 0) onSubmit?.(result.data);
  };

  return (
    <SchemaFormContext.Provider value={ctx}>
      <form noValidate onSubmit={submit} className="space-y-6">
        {node.kind === "object"
          ? <ObjectField node={node} path={[]} value={value as Record<string, unknown>} label="" />
          : <Field node={node} path={[]} value={value} label="" />}
        {onSubmit && (
          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line/15 bg-bg-elevated/95 px-4 py-3 backdrop-blur">
            {invalid && <Errors errors={[`Còn ${errorCount} lỗi cần sửa trước khi lưu`]} />}
            <button type="submit" disabled={invalid}
              className="inline-flex min-h-11 items-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {submitLabel}
            </button>
          </div>
        )}
      </form>
    </SchemaFormContext.Provider>
  );
}
