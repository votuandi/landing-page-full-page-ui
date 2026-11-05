"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionListEditor, thumbnailSrc, useLeaveGuard } from "@solar/cms-ui";
import { sectionLimitIssues } from "@solar/sections";
import type { PageEditor, PageSectionResult } from "../../../../lib/pageSections.ts";
import { saveSectionsDraft, publishSections, previewLink, restorePageVersion } from "../actions.ts";
import { UpgradeRequest } from "../../../../components/UpgradeRequest.tsx";

const base = "inline-flex min-h-11 items-center justify-center rounded-button px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40";
const button = `${base} border border-line/25 bg-bg-elevated text-fg hover:bg-bg-tint`;
const primary = `${base} bg-primary text-on-primary hover:opacity-90`;

export default function PageSectionsEditor({ editor }: { editor: PageEditor }) {
  const router = useRouter();
  const [restoreId, setRestoreId] = useState<string>();
  const [value, setValue] = useState(editor.sections);
  const [upgrade, setUpgrade] = useState<string>();
  const [saved, setSaved] = useState(JSON.stringify(editor.sections));
  const [revision, setRevision] = useState(editor.page.revision);
  const [hasDraft, setHasDraft] = useState(editor.hasDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [conflict, setConflict] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(value) !== saved;
  useLeaveGuard(dirty);
  const invalid = sectionLimitIssues(value).length > 0;
  const recoverable = [...editor.removed, ...editor.sections.filter(section => !editor.removed.some(s => s.id === section.id)).map(section => ({ ...section, expiresAt: null }))];
  const form = () => { const f = new FormData(); f.set("pageId", editor.page.id); f.set("revision", String(revision)); return f; };
  function run(work: () => Promise<PageSectionResult>, success: (result: PageSectionResult) => void, failure?: () => void) {
    setError(""); setMessage("");
    start(async () => {
      try {
        const result = await work();
        if (!result.ok) { failure?.(); setError(`${result.error ?? "Không thể thực hiện lúc này. Vui lòng thử lại."}${result.status === 409 ? " Nội dung bạn vừa sửa chưa được lưu." : ""}`); if (result.status === 409) setConflict(true); return; }
        if (result.revision !== undefined) setRevision(result.revision);
        success(result);
      } catch { failure?.(); setError("Không thể kết nối. Vui lòng thử lại."); }
    });
  }
  return <div className="min-w-0 space-y-4">
    {editor.canBuilder && <a href={`/trang/${editor.page.id}/builder`} className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:ring-2 focus-visible:ring-primary">Mở trình dựng</a>}
    {!editor.can.reorder && <p className="rounded-card border border-line/20 bg-bg-tint px-4 py-3 text-sm text-fg-muted">
      Gói hiện tại hoặc quyền của bạn chỉ cho sửa nội dung, không đổi bố cục trang.</p>}
    <p className="text-sm text-fg-muted">{hasDraft ? "Trang có bản nháp chưa xuất bản." : "Bố cục đang hiển thị là bản đã xuất bản."} Khách truy cập chỉ thấy thay đổi sau khi bạn xuất bản.</p>
    <fieldset disabled={pending || conflict} className="min-w-0">
      <legend className="sr-only">Bố cục section</legend>
      <SectionListEditor value={value} onChange={setValue} can={editor.can} allowedTypes={editor.allowedTypes} lockedTypes={editor.lockedTypes} onUpgrade={setUpgrade}
        thumbnail={(type, variant) => thumbnailSrc(editor.themeId, type, variant)} removed={recoverable}
        editHref={editor.canEditContent ? section => `/trang/${editor.page.id}/section/${section.id}` : undefined} />
    </fieldset>
    {upgrade && <UpgradeRequest key={upgrade} feature={upgrade} onClose={() => setUpgrade(undefined)} />}
    <section aria-label="Lịch sử xuất bản" className="space-y-3 rounded-card border border-line/20 bg-bg-elevated p-4">
      <h2 className="text-lg font-semibold text-fg">Lịch sử xuất bản</h2>
      {!editor.versions.length && <p className="text-sm text-fg-muted">Trang chưa có phiên bản đã xuất bản.</p>}
      <ul className="space-y-3">
        {editor.versions.map(version => <li key={version.id} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 break-words text-sm text-fg">Phiên bản {version.revision} · {new Date(version.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {version.publisher}</p>
            {editor.canRestore && <button type="button" className={button} aria-label={`Khôi phục phiên bản ${version.revision}`} disabled={dirty || pending || conflict} onClick={() => setRestoreId(version.id)}>Khôi phục</button>}
          </div>
          {restoreId === version.id && <div className="space-y-2 rounded-card bg-bg-tint p-3">
            <p className="text-sm text-fg">Bản nháp hiện tại sẽ được thay bằng phiên bản {version.revision}.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primary} disabled={dirty || pending || conflict} onClick={() => {
                const f = form(); f.set("versionId", version.id);
                run(() => restorePageVersion({}, f), () => { setRestoreId(undefined); setMessage("Đã khôi phục vào bản nháp"); router.refresh(); });
              }}>Xác nhận khôi phục</button>
              <button type="button" className={button} disabled={pending} onClick={() => setRestoreId(undefined)}>Hủy</button>
            </div>
          </div>}
        </li>)}
      </ul>
    </section>
    <div className="sticky bottom-0 flex flex-col gap-3 border-t border-line/20 bg-bg/95 px-3 py-3 backdrop-blur sm:flex-row sm:px-4 sm:items-center sm:justify-between sm:rounded-card sm:border sm:shadow-float" aria-busy={pending}>
      <div className="min-w-0 space-y-1">
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <p role="status" className="text-sm text-fg-muted">{pending ? "Đang xử lý…" : message || (dirty ? "Có thay đổi chưa lưu" : "Không có thay đổi chưa lưu")}</p>
        {conflict && <button type="button" className={button} onClick={() => window.location.reload()}>Tải lại trang</button>}
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
        {(editor.can.reorder || editor.can.variantSwitch) && <button type="button" className={button} disabled={pending || conflict || !dirty || invalid}
          onClick={() => { const f = form(); const snapshot = JSON.stringify(value); f.set("sections", snapshot); run(() => saveSectionsDraft({}, f), () => { setSaved(snapshot); setHasDraft(true); setMessage("Đã lưu nháp"); setPreviewUrl(""); }); }}>Lưu nháp</button>}
        <button type="button" className={button} disabled={pending || conflict || dirty} onClick={() => {
          const tab = window.open("about:blank", "_blank");
          if (tab) tab.opener = null;
          run(() => previewLink({}, form()), result => {
            setPreviewUrl(result.url ?? "");
            if (tab && result.url) tab.location.replace(result.url);
            setMessage("Liên kết xem trước có hiệu lực trong 10 phút.");
          }, () => tab?.close());
        }}>Xem trước</button>
        {editor.canPublish && <button type="button" className={primary} disabled={pending || conflict || dirty || invalid || !hasDraft}
          onClick={() => run(() => publishSections({}, form()), () => { setHasDraft(false); setMessage("Đã xuất bản"); setPreviewUrl(""); })}>Xuất bản</button>}
      </div>
      {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-button text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Mở bản xem trước (tab mới)</a>}
    </div>
  </div>;
}
