"use client";

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { describe } from "./schema/describe.ts";
import { issuesByPath, setAt, type Path } from "./schema/path.ts";
import { SchemaFormContext, type FormContext, type Pickers, type WidgetComponent } from "./context.ts";
import { ObjectField, Field } from "./fields/Field.tsx";
import { Errors } from "./ui.tsx";

const vi = z.locales.vi().localeError;

/** Validate bằng chính schema, thông báo tiếng Việt (message riêng trong schema được giữ nguyên). */
export function validate<S extends z.ZodType>(schema: S, value: unknown) {
  return schema.safeParse(value, { error: vi });
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

  const ctx = useMemo<FormContext>(() => ({ idPrefix, issues, bilingual, pickers, widgets, labels, update, setInputError }),
    [idPrefix, issues, bilingual, pickers, widgets, labels, update, setInputError]);
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
