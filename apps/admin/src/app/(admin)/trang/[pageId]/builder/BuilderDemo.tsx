"use client";

import "@puckeditor/core/no-external.css";
import { useEffect, useMemo, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { createUsePuck, Puck, type ComponentConfig, type Config, type Data } from "@puckeditor/core";
import { PreviewFrame, SchemaForm, useLeaveGuard } from "@solar/cms-ui";
import { sectionLimitIssues, sectionRegistry } from "@solar/sections";
import { previewLink, saveBuilderDraft } from "../../actions";
import { BUILDER_TYPES } from "../../../../../lib/builderTypes.ts";
import type { BuilderData } from "../../../../../lib/pageSections.ts";
import { editedContents, fromPuck, snapshot, toPuck } from "./puckAdapter.ts";

const usePuck = createUsePuck();
const ROOT = "root:default-zone";
const button = "inline-flex min-h-11 items-center justify-center rounded-button border border-line/25 bg-bg-elevated px-3 text-sm font-medium text-fg hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";
const isDemo = (type: string) => (BUILDER_TYPES as readonly string[]).includes(type);
const labelOf = (type: string) => sectionRegistry.getType(type)?.meta.label.vi ?? type;

/** Thay Puck.Fields: panel đó là một <form>, đặt SchemaForm vào sẽ thành form lồng form (HTML sai). */
function Inspector() {
  const selected = usePuck(state => state.selectedItem);
  const index = usePuck(state => state.appState.ui.itemSelector?.index);
  const dispatch = usePuck(state => state.dispatch);
  const def = selected && isDemo(String(selected.type)) ? sectionRegistry.getType(String(selected.type)) : undefined;
  if (!selected || !def || index === undefined) return <p className="p-3 text-sm text-fg-muted">Chọn một section để sửa.</p>;
  const change = (props: Record<string, unknown>) => dispatch({ type: "replace", destinationIndex: index, destinationZone: ROOT, data: { ...selected, props: { ...selected.props, ...props } } });
  return <div className="space-y-4 p-3">
    <label className="block space-y-1 text-sm font-medium text-fg">Kiểu hiển thị
      <select value={selected.props.variant} onChange={event => change({ variant: event.target.value })} className="block min-h-11 w-full rounded-input border border-line/25 bg-bg px-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {sectionRegistry.variantsOf(def.type)?.map(variant => <option key={variant}>{variant}</option>)}
      </select>
    </label>
    <SchemaForm key={selected.props.id} schema={def.schema} value={selected.props.data} onChange={next => change({ data: next })} />
  </div>;
}

/** Token preview chỉ dùng một lần: lấy link khi mở, làm mới bằng postMessage thay vì remount iframe. */
function Preview({ pageId, sectionId, refresh }: { pageId: string; sectionId: string; refresh: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const form = new FormData();
    form.set("pageId", pageId);
    void previewLink({}, form).then(result => { if (result.url) setSrc(result.url); });
  }, [pageId]);
  return src ? <PreviewFrame src={src} title="Xem trước" sectionId={sectionId} targetOrigin={new URL(src).origin} refreshKey={refresh} /> : null;
}

function buildConfig(data: BuilderData): Config {
  const types = [...new Set([...BUILDER_TYPES, ...data.editor.sections.map(section => section.type)])];
  const components: Record<string, ComponentConfig> = {};
  for (const type of types) {
    const def = sectionRegistry.getType(type);
    if (!def) continue;
    const insertable = isDemo(type) && (data.editor.allowedTypes as string[]).includes(type) && data.editor.can.reorder;
    components[type] = {
      label: def.meta.label.vi,
      defaultProps: { variant: sectionRegistry.variantsOf(type)?.[0] ?? "", enabled: true, data: def.defaults },
      permissions: { insert: insertable, duplicate: false },
      render: ({ id, variant }) => <article data-testid="section" data-section-id={id} data-section-type={type} className="m-2 rounded-card border border-line/25 bg-bg-elevated p-4 text-fg">
        <p className="font-semibold">{def.meta.label.vi}</p>
        <p className="text-sm text-fg-muted">{variant}{isDemo(type) ? "" : " · giữ nguyên, không sửa trong demo"}</p>
      </article>,
    };
  }
  return { components, categories: { demo: { title: "Thư viện", components: [...BUILDER_TYPES] }, other: { visible: false } } };
}

function LibraryItem({ name, data, children }: { name: string; data: BuilderData; children: ReactNode }) {
  const content = usePuck(state => state.appState.data.content);
  const reason = !(data.editor.allowedTypes as string[]).includes(name) ? "Cần nâng cấp gói" : sectionLimitIssues([...content.map(item => ({ type: String(item.type) })), { type: name }])[0];
  return <div data-testid={`lib-${name}`} aria-disabled={reason ? "true" : undefined} title={reason} className={reason ? "pointer-events-none opacity-50" : undefined}>{children}</div>;
}

function Editor({ data, onSaved, refresh }: { data: BuilderData; onSaved(): void; refresh: number }) {
  const appData = usePuck(state => state.appState.data);
  const history = usePuck(state => state.history);
  const dispatch = usePuck(state => state.dispatch);
  const [revision, setRevision] = useState(data.editor.page.revision);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(() => ({ contents: snapshot(toPuck(data.editor.sections, data.contents)), order: JSON.stringify(fromPuck(toPuck(data.editor.sections, data.contents))) }));
  const sections = useMemo(() => fromPuck(appData), [appData]);
  const dirty = JSON.stringify(sections) !== saved.order || Object.keys(editedContents(appData, saved.contents)).length > 0;
  useLeaveGuard(dirty);
  const save = () => {
    const form = new FormData();
    form.set("pageId", data.editor.page.id); form.set("revision", String(revision));
    form.set("sections", JSON.stringify(sections)); form.set("contents", JSON.stringify(editedContents(appData, saved.contents)));
    setError(""); setMessage("");
    start(async () => {
      const result = await saveBuilderDraft({}, form);
      if (!result.ok) { setError(result.error ?? "Không thể lưu lúc này."); return; }
      if ("revision" in result) setRevision(result.revision as number);
      setSaved({ contents: snapshot(appData), order: JSON.stringify(sections) });
      setMessage("Đã lưu nháp"); onSaved();
    });
  };
  const insert = (type: string) => dispatch({ type: "insert", componentType: type, destinationIndex: appData.content.length, destinationZone: ROOT });
  const reorder = (from: number, to: number) => dispatch({ type: "reorder", sourceIndex: from, destinationIndex: to, destinationZone: ROOT });
  const select = (index: number) => dispatch({ type: "setUi", ui: { itemSelector: { index, zone: ROOT } } });
  // Màu muted của Puck chỉ đạt 4.33:1 trên nền admin; đưa về token để đạt AA.
  return <div style={{ "--puck-color-text-muted": "rgb(var(--c-fg-muted))" } as CSSProperties} className="grid h-[calc(100dvh-8rem)] min-h-0 grid-cols-[17rem_minmax(0,1fr)_22rem] gap-3 text-fg">
    <aside className="min-h-0 space-y-4 overflow-auto">
      <Puck.Components />
      <section aria-labelledby="builder-add" className="space-y-2">
        <h2 id="builder-add" className="text-sm font-semibold">Thêm bằng nút</h2>
        {BUILDER_TYPES.map(type => {
          const reason = !data.editor.allowedTypes.includes(type) ? "Cần nâng cấp gói" : sectionLimitIssues([...sections, { type }])[0];
          return <button key={type} type="button" className={`${button} w-full`} disabled={Boolean(reason)} title={reason} onClick={() => insert(type)}>Thêm {labelOf(type)}</button>;
        })}
      </section>
      <section aria-labelledby="builder-order" className="space-y-2">
        <h2 id="builder-order" className="text-sm font-semibold">Thứ tự section</h2>
        <ol className="space-y-2">{sections.map((section, index) => <li key={section.id} className="rounded-card border border-line/20 p-2 text-sm">
          <p className="pb-1 font-medium">{labelOf(section.type)}</p>
          <div className="flex gap-1">
            <button type="button" className={button} disabled={index === 0} aria-label={`Đưa ${section.id} lên`} onClick={() => reorder(index, index - 1)}>Lên</button>
            <button type="button" className={button} disabled={index === sections.length - 1} aria-label={`Đưa ${section.id} xuống`} onClick={() => reorder(index, index + 1)}>Xuống</button>
            <button type="button" className={button} aria-label={`Sửa ${section.id}`} onClick={() => select(index)}>Sửa</button>
          </div>
        </li>)}</ol>
      </section>
    </aside>
    <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} disabled={!history.hasPast} onClick={history.back}>Hoàn tác</button>
        <button type="button" className={button} disabled={!history.hasFuture} onClick={history.forward}>Làm lại</button>
        <button type="button" className={button} disabled={pending || !dirty} onClick={save}>Lưu nháp</button>
        <p role="status" className="text-sm text-fg-muted">{message}</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
      <div className="min-h-0 overflow-auto rounded-card border border-line/20"><Puck.Preview /></div>
      <Preview pageId={data.editor.page.id} sectionId={data.editor.sections[0]?.id ?? "trang"} refresh={refresh} />
    </main>
    <aside aria-label="Thuộc tính section" className="min-h-0 overflow-auto rounded-card border border-line/20"><Inspector /></aside>
  </div>;
}

/** Demo Puck (spike E12-S01): canvas chỉ có thẻ, trang thật nằm trong iframe preview như D10. */
export default function BuilderDemo({ data }: { data: BuilderData }) {
  const config = useMemo(() => buildConfig(data), [data]);
  const initial = useMemo<Data>(() => toPuck(data.editor.sections, data.contents), [data]);
  const [refresh, setRefresh] = useState(0);
  return <Puck config={config} data={initial} iframe={{ enabled: false }} overrides={{ drawerItem: ({ name, children }) => <LibraryItem name={name} data={data}>{children}</LibraryItem> }}>
    <Editor data={data} refresh={refresh} onSaved={() => setRefresh(value => value + 1)} />
  </Puck>;
}
