"use client";

import { useRef, useState } from "react";
import { PreviewFrame, SchemaForm, useAutosave, useLeaveGuard, validate } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import type { PageSectionResult, SectionContent } from "../../../../../../lib/pageSections.ts";
import { saveSectionContent } from "../../../actions.ts";

const button = "inline-flex min-h-11 items-center rounded-button border border-line/20 bg-bg-elevated px-4 py-2 text-sm font-medium text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const dot = { saved: "bg-success", pending: "bg-fg-subtle", saving: "bg-primary motion-safe:animate-pulse", invalid: "bg-danger", error: "bg-danger", conflict: "bg-danger" };
const messages = { saved: "Đã lưu nháp", pending: "Đang chờ lưu…", saving: "Đang lưu…", invalid: "Có lỗi cần sửa — chưa lưu", error: "Không lưu được nội dung", conflict: "Trang đã thay đổi ở nơi khác" };
export default function SectionContentEditor({ editor, previewUrl }: { editor: SectionContent; previewUrl: string }) {
  const def = sectionRegistry.getType(editor.section.type)!;
  const [value, setValue] = useState(editor.data);
  const [formValid, setFormValid] = useState(true);
  const revision = useRef(editor.page.revision);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const autosave = useAutosave(value, {
    valid: next => formValid && validate(def.schema, next).success,
    save: async next => {
      const form = new FormData();
      form.set("pageId", editor.page.id); form.set("sectionId", editor.section.id);
      form.set("revision", String(revision.current)); form.set("data", JSON.stringify(next));
      const result: PageSectionResult = await saveSectionContent({}, form);
      if (!result.ok || result.revision === undefined) return { ok: false, error: result.error ?? "Không thể lưu. Vui lòng thử lại.", conflict: result.status === 409 };
      revision.current = result.revision; setRefreshKey(key => key + 1);
      return { ok: true };
    },
  });
  useLeaveGuard(autosave.dirty);
  return <section data-testid="content-editor" className="min-w-0 space-y-4">
    <a href={`/trang/${editor.page.id}`} className="inline-flex min-h-11 items-center rounded-button text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về bố cục trang</a>
    <div className="space-y-2">
      <h1 className="break-words text-2xl font-semibold text-fg">{editor.section.label}</h1>
      <p className="break-words text-sm text-fg-muted">{editor.page.title} · Nội dung tự lưu vào bản nháp. Xuất bản từ bố cục trang để khách truy cập thấy thay đổi.</p>
      {editor.recovered && <p role="alert" className="text-sm font-medium text-danger">Dữ liệu cũ không đọc được, đang hiển thị mặc định</p>}
      {editor.readOnly && <p role="alert" className="text-sm font-medium text-danger">{editor.readOnly}</p>}
    </div>
    <div className="sticky top-0 z-10 -mx-1 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-line/15 bg-bg/95 px-1 py-2 backdrop-blur">
      <p role="status" aria-live="polite" className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted">
        <span aria-hidden className={`size-2 shrink-0 rounded-pill ${dot[autosave.status]}`} />{messages[autosave.status]}
      </p>
      <div className="flex flex-wrap gap-2">
        {autosave.status === "conflict" && <button type="button" className={button} onClick={() => window.location.reload()}>Tải lại</button>}
        {autosave.status === "error" && <button type="button" className={button} onClick={() => { void autosave.flush(); }}>Thử lưu lại</button>}
        <button type="button" aria-expanded={showPreview} aria-controls="section-preview" className={`${button} lg:hidden`} onClick={() => setShowPreview(show => !show)}>{showPreview ? "Ẩn xem trước" : "Xem trước"}</button>
      </div>
    </div>
    {autosave.error && <p role="alert" className="text-sm font-medium text-danger">{autosave.error}</p>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-5">
      <fieldset disabled={Boolean(editor.readOnly) || autosave.status === "conflict"} className="min-w-0 lg:col-span-2">
        <legend className="sr-only">Nội dung {editor.section.label}</legend>
        <SchemaForm schema={def.schema} value={value} onChange={setValue} onValidityChange={setFormValid} bilingual={editor.bilingual} />
      </fieldset>
      <div id="section-preview" className={`${showPreview ? "flex" : "hidden"} order-first min-w-0 flex-col gap-2 lg:order-none lg:col-span-3 lg:flex lg:sticky lg:top-16 lg:self-start`}>
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Xem trước bản nháp · chỉ bạn thấy</p>
        <div className="h-[70dvh] min-h-96 lg:h-[calc(100dvh-10rem)]">
          <PreviewFrame src={previewUrl} title="Xem trước nội dung section" sectionId={editor.section.id} targetOrigin={new URL(previewUrl).origin} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  </section>;
}
