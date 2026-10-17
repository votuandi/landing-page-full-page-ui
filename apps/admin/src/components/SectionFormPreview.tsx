"use client";

import { useState } from "react";
import { SchemaForm } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";

/** Form của một type với dữ liệu mẫu; lưu nháp vào DB là E7-S05. */
export function SectionFormPreview({ type, bilingual }: { type: string; bilingual: boolean }) {
  const def = sectionRegistry.getType(type);
  const [value, setValue] = useState<unknown>(() => structuredClone(def?.defaults));
  const [checked, setChecked] = useState<string | null>(null);
  if (!def) return null;
  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line/15 bg-bg-elevated p-4 sm:p-6">
        <SchemaForm schema={def.schema} value={value} bilingual={bilingual} submitLabel="Kiểm tra"
          onChange={(next) => { setValue(next); setChecked(null); }}
          onSubmit={(data) => setChecked(JSON.stringify(data, null, 2))} />
      </div>
      {checked && (
        <details open className="rounded-card border border-success/40 bg-bg-elevated p-4">
          <summary className="cursor-pointer text-sm font-semibold text-success">Dữ liệu hợp lệ — bản sẽ được lưu</summary>
          <pre className="mt-3 max-h-96 overflow-auto text-xs text-fg-muted">{checked}</pre>
        </details>
      )}
    </div>
  );
}
