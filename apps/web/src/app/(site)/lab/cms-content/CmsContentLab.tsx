"use client";

import { useState } from "react";
import type { z } from "zod";
import { SchemaForm, useAutosave, useLeaveGuard, validate } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";

const def = sectionRegistry.types.hero;
const messages = { saved: "Đã lưu nháp", pending: "Đang chờ lưu…", saving: "Đang lưu…", invalid: "Có lỗi cần sửa — chưa lưu", error: "Không thể lưu", conflict: "Trang đã thay đổi ở nơi khác" };
export default function CmsContentLab() {
  const [value, setValue] = useState<z.input<typeof def.schema>>(def.defaults);
  const [formValid, setFormValid] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const autosave = useAutosave(value, { valid: next => formValid && validate(def.schema, next).success,
    save: async () => { await new Promise(resolve => setTimeout(resolve, 150)); return { ok: true }; } });
  useLeaveGuard(autosave.dirty);
  return <div data-testid="content-editor" className="min-w-0 space-y-4">
    <a href="/lab/cms-sections" className="inline-flex min-h-11 items-center rounded-button text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về bố cục trang</a>
    <p className="text-sm text-fg-muted">[DỮ LIỆU MẪU] Form tự lưu giả lập; khung minh họa hiển thị nội dung mẫu cố định.</p>
    <p role="status" aria-live="polite" className="text-sm text-fg-muted">{messages[autosave.status]}</p>
    <div className="grid min-w-0 gap-6 lg:grid-cols-5">
      <fieldset className="min-w-0 lg:col-span-2"><legend className="sr-only">Nội dung section</legend>
        <SchemaForm schema={def.schema} value={value} onChange={setValue} onValidityChange={setFormValid} bilingual />
      </fieldset>
      <div className="min-w-0 lg:col-span-3">
        <button type="button" aria-expanded={showPreview} aria-controls="lab-content-preview" className="min-h-11 rounded-button border border-line/20 px-4 py-2 text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden" onClick={() => setShowPreview(show => !show)}>{showPreview ? "Ẩn xem trước" : "Xem trước"}</button>
        <div id="lab-content-preview" className={`${showPreview ? "block" : "hidden"} mt-3 h-[calc(100dvh-8rem)] min-h-96 lg:sticky lg:top-4 lg:mt-0 lg:block`}>
          <iframe src="/lab/cms-content/frame" title="Xem trước nội dung section" className="h-full min-h-96 w-full rounded-card border border-line/20 bg-bg" />
        </div>
      </div>
    </div>
  </div>;
}
