"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DndContext, DragOverlay, MouseSensor, pointerWithin, useSensor, useSensors, type Announcements, type DragMoveEvent } from "@dnd-kit/core";
import { insertRelative, libraryStatus, moveRelative, newSectionId, PREVIEW_MESSAGE, PreviewFrame, useLeaveGuard, type PreviewEvent, type PreviewFrameHandle } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import type { BuilderEditor, PageSectionResult } from "../../../../../lib/pageSections.ts";
import { createBuilderQueue } from "../../../../../lib/builderQueue.ts";
import { createPreviewWatch, selectBuilderSection } from "../../../../../lib/builderState.ts";
import { builderPreviewLink, saveSectionContent, saveSectionsDraft } from "../../actions.ts";
import BuilderPanel, { type BuilderPanelHandle } from "./BuilderPanel";
import DeviceStage from "./DeviceStage";
import SectionLibrary, { type LibraryItem } from "./SectionLibrary";

const button = "inline-flex min-h-11 items-center justify-center rounded-button border border-line/20 bg-bg-elevated px-3 py-2 text-sm font-medium text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
const move = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-button px-2 text-xs font-medium text-fg-muted hover:bg-bg-tint hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40";
const instructions = { draggable: "Bấm Thêm để chèn section sau section đang chọn. Có thể dùng chuột để kéo vào trang." };
const announcements: Announcements = {
  onDragStart: () => "Đã nhấc section từ thư viện. Kéo vào trang để chèn, Esc để hủy.",
  onDragOver: ({ over }) => over ? "Đang ở khung xem trước trang." : "Đã ra ngoài khung xem trước.",
  onDragEnd: ({ over }) => over ? "Đã thả trên trang." : "Đã thả ngoài trang, không thêm section.",
  onDragCancel: () => "Đã hủy thêm section.",
};
export default function Builder({ editor }: { editor: BuilderEditor }) {
  const [sections, setSections] = useState(editor.sections);
  const [forms, setForms] = useState(editor.forms);
  const [selectedId, setSelectedId] = useState<string | null>(editor.sections[0]?.id ?? null);
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);
  const [src, setSrc] = useState(editor.previewUrl);
  const [width, setWidth] = useState(1440);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [dragged, setDragged] = useState<LibraryItem | null>(null);
  const dndId = useId();
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }));
  const preview = useRef<PreviewFrameHandle>(null), stage = useRef<HTMLDivElement>(null);
  const pending = useRef<LibraryItem | null>(null), overCanvas = useRef(false);
  // dnd-kit's delta also counts scrolling of the item's containers; the canvas needs the real pointer position.
  const pointer = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const track = (event: MouseEvent) => { pointer.current = { x: event.clientX, y: event.clientY }; };
    window.addEventListener("mousemove", track, true);
    return () => window.removeEventListener("mousemove", track, true);
  }, []);
  const [queue] = useState(() => createBuilderQueue(editor.page.revision));
  const [watch] = useState(() => createPreviewWatch(() => setExpired(true)));
  const panel = useRef<BuilderPanelHandle>(null), list = useRef<HTMLUListElement>(null);
  const changing = useRef(false);
  const latest = useRef({ sections, selectedId });
  useEffect(() => { latest.current = { sections, selectedId }; }, [sections, selectedId]);
  useEffect(() => () => watch.cancel(), [watch]);
  useLeaveGuard(dirty || busy);
  const refresh = useCallback(() => { watch.request(); setExpired(false); setRefreshKey(key => key + 1); }, [watch]);
  const resultError = useCallback((result: PageSectionResult) => {
    setError(result.error ?? "Không thể lưu. Vui lòng thử lại.");
    if (result.status === 409) setConflict(true);
  }, []);
  function formData(revision?: number) {
    const form = new FormData(); form.set("pageId", editor.page.id);
    if (revision !== undefined) form.set("revision", String(revision));
    return form;
  }
  async function choose(id: string) {
    if (changing.current || conflict) { setSelectionKey(key => key + 1); return; }
    changing.current = true; setBusy(true);
    try {
      const result = await selectBuilderSection(latest.current.sections.map(s => s.id), latest.current.selectedId, id,
        () => panel.current?.flush() ?? Promise.resolve({ ok: true }));
      if (result.selectedId !== latest.current.selectedId) setDirty(false);
      setSelectedId(result.selectedId); setError(result.error);
      // A rejected canvas selection needs an explicit reply even though selectedId has not changed.
      setSelectionKey(key => key + 1);
    } finally { changing.current = false; setBusy(false); }
  }
  async function reorder(id: string, targetId: string, position: "before" | "after") {
    if (!editor.canReorder || conflict || changing.current) return;
    const previous = latest.current.sections, next = moveRelative(previous, id, targetId, position);
    if (next === previous) return;
    changing.current = true; setBusy(true); setError(undefined); setSections(next);
    try {
      const result = await queue.write(revision => {
        const form = formData(revision); form.set("sections", JSON.stringify(next)); return saveSectionsDraft({}, form);
      });
      if (result.ok) refresh();
      else { setSections(previous); resultError(result); }
    } finally { changing.current = false; setBusy(false); }
  }
  async function addSection(type: string, variant: string, target?: Extract<PreviewEvent, { action: "insert" }>) {
    if (!editor.canReorder || conflict || changing.current) return;
    const status = libraryStatus(type, latest.current.sections, editor.allowedTypes, editor.lockedTypes);
    if (status.kind !== "ok") { setError(status.reason); return; }
    const def = sectionRegistry.getType(type);
    if (!def || !sectionRegistry.variantsOf(type)?.includes(variant)) return;
    const section = { id: newSectionId(type), type, variant, enabled: true };
    const previous = latest.current.sections;
    const next = insertRelative(previous, section, target ? target.targetId : latest.current.selectedId ?? undefined, target?.position ?? "after");
    changing.current = true; setBusy(true); setError(undefined); setSections(next); latest.current.sections = next;
    let added = false;
    try {
      const result = await queue.write(revision => {
        const form = formData(revision); form.set("sections", JSON.stringify(next)); return saveSectionsDraft({}, form);
      });
      if (result.ok) {
        setForms(current => ({ ...current, [section.id]: { data: def.defaults, recovered: false, readOnly: undefined } }));
        refresh(); added = true;
      } else { setSections(previous); latest.current.sections = previous; resultError(result); }
    } finally { changing.current = false; setBusy(false); }
    if (added) await choose(section.id);
  }
  function cancelDrag() {
    pending.current = null; setDragged(null);
    if (overCanvas.current) preview.current?.post({ type: PREVIEW_MESSAGE, action: "drag-cancel" });
    overCanvas.current = false;
  }
  function canvasY(event: Pick<DragMoveEvent, "over">) {
    const rect = stage.current?.querySelector("iframe")?.getBoundingClientRect();
    if (event.over?.id !== "canvas" || !pointer.current || !rect?.width) return null;
    const { x, y } = pointer.current;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    return (y - rect.top) / (rect.width / width);
  }
  function dragMove(event: DragMoveEvent) {
    const y = canvasY(event);
    if (y === null) {
      if (overCanvas.current) preview.current?.post({ type: PREVIEW_MESSAGE, action: "drag-cancel" });
      overCanvas.current = false;
    } else {
      overCanvas.current = true; preview.current?.post({ type: PREVIEW_MESSAGE, action: "drag", y });
    }
  }
  function onEvent(event: PreviewEvent) {
    if (event.action === "updated") { watch.updated(); setExpired(false); }
    if (event.action === "select") void choose(event.sectionId);
    if (event.action === "reorder") void reorder(event.sectionId, event.targetId, event.position);
    if (event.action === "insert") {
      const item = pending.current; pending.current = null;
      if (item) void addSection(item.type, item.variant, event);
    }
    if (event.action === "visible" && sections.some(s => s.id === event.sectionId)) {
      setVisibleId(event.sectionId);
      const row = [...(list.current?.children ?? [])].find(child => (child as HTMLElement).dataset.sectionId === event.sectionId) as HTMLElement | undefined;
      const container = list.current;
      if (container && row) {
        const bounds = container.getBoundingClientRect(), rect = row.getBoundingClientRect();
        if (rect.top < bounds.top || rect.bottom > bounds.bottom) container.scrollTo({ top: container.scrollTop + rect.top - bounds.top, behavior: "auto" });
      }
    }
  }
  const selected = sections.find(section => section.id === selectedId);
  return <section className="min-w-0 space-y-4" aria-label="Trình dựng trang">
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <a href={`/trang/${editor.page.id}`} className="inline-flex min-h-11 items-center rounded-button text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về bố cục trang</a>
        <h1 className="break-words text-2xl font-semibold text-fg">{editor.page.title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-labelledby="builder-device" className="flex flex-wrap items-center gap-2">
          <span id="builder-device" className="text-sm text-fg-muted">Khung (px)</span>
          {[390, 768, 1440].map(device => <button key={device} type="button" aria-pressed={width === device} className={`${button} aria-pressed:border-primary aria-pressed:bg-bg-tint aria-pressed:text-primary`} onClick={() => setWidth(device)}>{device}</button>)}
        </div>
        <button type="button" className={button} disabled={loadingPreview} onClick={async () => {
          cancelDrag(); setLoadingPreview(true);
          try {
            const result = await builderPreviewLink({}, formData());
            if (result.ok && result.url) { setSrc(result.url); setExpired(false); watch.cancel(); }
            else setError(result.error ?? "Không thể tải xem trước. Vui lòng thử lại.");
          } catch { setError("Không thể kết nối. Vui lòng thử lại."); }
          finally { setLoadingPreview(false); }
        }}>{loadingPreview ? "Đang tải xem trước…" : "Tải lại xem trước"}</button>
      </div>
    </div>
    <p className="text-sm text-fg-muted">Kéo section từ thư viện vào trang hoặc bấm Thêm để chèn sau section đang chọn. Thay đổi tự lưu vào bản nháp. Dùng nút Lên, Xuống để sắp xếp bằng bàn phím hoặc cảm ứng.</p>
    {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
    {conflict && <button type="button" className={button} onClick={() => window.location.reload()}>Tải lại trang</button>}
    {expired && <p role="status" className="text-sm font-medium text-danger">Phiên xem trước có thể đã hết hạn. Vui lòng tải lại xem trước.</p>}
    <DndContext id={dndId} sensors={sensors} collisionDetection={pointerWithin} autoScroll={false} accessibility={{ announcements, screenReaderInstructions: instructions }}
      onDragStart={({ active }) => {
        cancelDrag();
        if (!editor.canReorder || conflict || changing.current) return;
        const item = active.data.current as LibraryItem | undefined;
        if (item && libraryStatus(item.type, latest.current.sections, editor.allowedTypes, editor.lockedTypes).kind === "ok") setDragged(item);
      }}
      onDragMove={dragMove} onDragOver={dragMove} onDragCancel={cancelDrag}
      onDragEnd={event => {
        const y = canvasY(event), item = dragged;
        if (y === null || !item || conflict || changing.current) { cancelDrag(); return; }
        pending.current = item; overCanvas.current = false; setDragged(null);
        preview.current?.post({ type: PREVIEW_MESSAGE, action: "drop", y });
      }}>
    {/* 1280px with the admin sidebar leaves ~990px: narrower side columns keep the 1440 canvas readable. */}
    <div className="grid min-w-0 gap-3 xl:grid-cols-[13.5rem_minmax(0,1fr)_18rem] 2xl:gap-4 2xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
      <SectionLibrary themeId={editor.themeId} sections={sections} allowedTypes={editor.allowedTypes} lockedTypes={editor.lockedTypes}
        canReorder={editor.canReorder} disabled={busy || conflict} onAdd={(type, variant) => { pending.current = null; void addSection(type, variant); }} />
      <div ref={stage} className="min-w-0" inert={conflict}>
        <DeviceStage width={width}>
          <PreviewFrame handle={preview} src={src} title="Xem trước trang" className={`border-0 ${dragged ? "pointer-events-none" : ""}`} targetOrigin={new URL(src).origin} refreshKey={refreshKey} selectedId={selectedId ?? undefined}
            selectionKey={selectionKey} onEvent={onEvent} />
        </DeviceStage>
      </div>
      <div className="flex min-w-0 flex-col gap-4 xl:h-[78dvh] xl:min-h-96">
        <nav aria-label="Danh sách section" className="min-w-0 shrink-0">
          <ul ref={list} aria-label="Section của trang" className="max-h-60 space-y-1 overflow-y-auto overscroll-contain rounded-card border border-line/20 bg-bg-elevated p-1">
            {sections.map((section, index) => {
              const label = sectionRegistry.getType(section.type)?.meta.label.vi ?? section.type;
              return <li key={section.id} data-section-id={section.id} className={`flex min-w-0 items-center gap-1 rounded-button border ${section.id === selectedId ? "border-primary bg-bg-tint" : "border-transparent"}`}>
                <button type="button" aria-label={`Chọn ${label}`} aria-current={section.id === visibleId ? "true" : undefined} aria-pressed={section.id === selectedId} disabled={busy || conflict}
                  className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-button px-2 text-left text-sm font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => { void choose(section.id); }}>
                  <span aria-hidden className="size-2 shrink-0 rounded-pill group-aria-[current=true]:bg-primary" />
                  <span className="min-w-0 break-words">{label}{!section.enabled && <span className="block text-xs font-normal text-fg-muted">Đang ẩn</span>}</span>
                </button>
                {editor.canReorder && <div className="flex shrink-0">
                  <button type="button" aria-label={`Lên ${label}`} className={move} disabled={index === 0 || busy || conflict} onClick={() => { void reorder(section.id, sections[index - 1].id, "before"); }}>Lên</button>
                  <button type="button" aria-label={`Xuống ${label}`} className={move} disabled={index === sections.length - 1 || busy || conflict} onClick={() => { void reorder(section.id, sections[index + 1].id, "after"); }}>Xuống</button>
                </div>}
              </li>;
            })}
          </ul>
          {!sections.length && <p className="text-sm text-fg-muted">Trang chưa có section. Chọn Thêm trong thư viện để bắt đầu.</p>}
        </nav>
        <div className="min-h-0 min-w-0 flex-1 rounded-card border border-line/20 bg-bg-elevated p-4 xl:overflow-y-auto">
          {selected && Object.hasOwn(forms, selected.id) ? <BuilderPanel key={selected.id} ref={panel} section={selected} form={forms[selected.id]} bilingual={editor.bilingual} disabled={!editor.canEditContent || conflict}
            onDirty={setDirty} onChange={data => setForms(current => ({ ...current, [selected.id]: { ...current[selected.id], data } }))}
            save={data => queue.write(async revision => {
              const form = formData(revision); form.set("sectionId", selected.id); form.set("data", JSON.stringify(data));
              const result = await saveSectionContent({}, form);
              if (result.ok) { setError(undefined); refresh(); } else resultError(result);
              return result;
            })} /> : <section aria-label="Thuộc tính section" className="text-sm text-fg-muted">{selected ? "Section không thuộc gói hiện tại. Nâng cấp gói để sửa nội dung." : "Chọn section để sửa nội dung."}</section>}
        </div>
      </div>
    </div>
    <DragOverlay dropAnimation={null}>{dragged ? <div className="max-w-60 rounded-card border border-primary bg-bg-elevated p-3 text-sm font-semibold text-fg shadow-float">
      {sectionRegistry.getType(dragged.type)?.meta.label.vi} · {dragged.variant}
    </div> : null}</DragOverlay>
    </DndContext>
  </section>;
}
