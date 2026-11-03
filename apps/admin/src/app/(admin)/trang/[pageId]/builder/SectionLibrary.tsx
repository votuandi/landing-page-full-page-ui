"use client";

import { useId, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { LIBRARY_GROUPS, libraryStatus, SectionThumbnail, thumbnailSrc } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import type { BuilderEditor } from "../../../../../lib/pageSections.ts";

export type LibraryItem = { type: string; variant: string };
type Props = Pick<BuilderEditor, "themeId" | "sections" | "allowedTypes" | "lockedTypes" | "canReorder"> & {
  disabled: boolean; onAdd(type: string, variant: string): void;
};
const button = "min-h-11 min-w-0 rounded-input border border-transparent text-left text-sm text-fg hover:border-primary/50 hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:text-fg-muted disabled:hover:border-transparent disabled:hover:bg-transparent";

export default function SectionLibrary({ themeId, sections, allowedTypes, lockedTypes, canReorder, disabled, onAdd }: Props) {
  const id = useId();
  return <aside aria-label="Thư viện section" className="max-h-[50dvh] min-w-0 space-y-5 overflow-y-auto overscroll-contain rounded-card border border-line/20 bg-bg-elevated p-3 xl:max-h-[78dvh]">
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-fg">Thư viện section</h2>
      <p className="text-xs text-fg-muted">{canReorder ? "Kéo vào trang hoặc bấm để chèn sau section đang chọn." : "Gói hoặc quyền hiện tại không cho thêm section."}</p>
    </div>
    {LIBRARY_GROUPS.map(group => <section key={group.id} aria-labelledby={`${id}-${group.id}`} className="space-y-2">
      <h3 id={`${id}-${group.id}`} className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{group.label}</h3>
      <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">{group.types.map(type => {
        const status = libraryStatus(type, sections, allowedTypes, lockedTypes);
        const reason = !canReorder ? "Gói hoặc quyền hiện tại không cho thêm section" : status.kind !== "ok" ? status.reason : undefined;
        return <LibraryRow key={type} type={type} themeId={themeId} status={status.kind} reason={reason} disabled={disabled || Boolean(reason)} onAdd={onAdd} />;
      })}</ul>
    </section>)}
  </aside>;
}

function LibraryRow({ type, themeId, status, reason, disabled, onAdd }: {
  type: string; themeId: string; status: "ok" | "locked" | "limit"; reason?: string; disabled: boolean; onAdd: Props["onAdd"];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId(), label = sectionRegistry.getType(type)!.meta.label.vi;
  const variants = sectionRegistry.variantsOf(type)!;
  return <li data-library-type={type} data-library-status={status} className="min-w-0 rounded-card border border-line/15 bg-bg p-1.5">
    <AddButton type={type} variant={variants[0]} themeId={themeId} label={`Thêm ${label}`} text={label} disabled={disabled} describedBy={reason ? `${id}-reason` : undefined} onAdd={onAdd} />
    {(status === "locked" || reason) && <p id={`${id}-reason`} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1.5 pt-1 text-xs text-fg-muted">
      {status === "locked" && <span className="rounded-pill border border-line/25 px-2 py-0.5 font-medium text-fg">Khóa theo gói</span>}{reason}</p>}
    {/* Variants stay browsable when the type is locked or at its limit: only adding is blocked. */}
    <button type="button" aria-label={`Kiểu của ${label}`} aria-expanded={expanded} aria-controls={expanded ? `${id}-variants` : undefined}
      className="mt-0.5 inline-flex min-h-8 items-center gap-1 rounded-button px-1.5 text-xs font-medium text-fg-muted hover:bg-bg-tint hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={() => setExpanded(value => !value)}>
      {variants.length} kiểu<span aria-hidden className={`inline-block transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}>▾</span>
    </button>
    {expanded && <div id={`${id}-variants`} className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-line/15 pt-1.5">{variants.map(variant => <AddButton key={variant} type={type} variant={variant} themeId={themeId}
      label={`Thêm ${label} kiểu ${variant}`} text={variant} fill disabled={disabled} describedBy={reason ? `${id}-reason` : undefined} onAdd={onAdd} />)}</div>}
  </li>;
}

function AddButton({ type, variant, themeId, label, text, fill = false, disabled, describedBy, onAdd }: LibraryItem & {
  themeId: string; label: string; text: string; fill?: boolean; disabled: boolean; describedBy?: string; onAdd: Props["onAdd"];
}) {
  const id = useId();
  const { setNodeRef, attributes, listeners } = useDraggable({ id, data: { type, variant }, disabled });
  return <button type="button" ref={setNodeRef} {...attributes} {...listeners} aria-label={label} aria-roledescription="section có thể kéo"
    aria-describedby={describedBy ?? attributes["aria-describedby"]} disabled={disabled}
    className={`${button} w-full ${fill ? "grid gap-1.5 p-1.5" : "flex items-center gap-2.5 p-1.5"} ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`} onClick={() => onAdd(type, variant)}>
    <SectionThumbnail src={thumbnailSrc(themeId, type, variant)} variant={variant} fill={fill} className={fill ? undefined : "w-16"} />
    <span className={`min-w-0 break-words ${fill ? "px-0.5 text-xs" : "font-medium"}`}>{text}</span>
  </button>;
}
