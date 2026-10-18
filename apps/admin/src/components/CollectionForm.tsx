"use client";

import Link from "next/link";
import { createContext, use, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SchemaForm, useSchemaForm, type FieldProps } from "@solar/cms-ui";
import { collectionDefs, collectionFormSchema, slugify, type Collection } from "@solar/db/collections";
import type { ActionResult } from "../lib/action.ts";
import { saveCollection } from "../app/(admin)/noi-dung/actions.ts";

const labels = { title: "Tiêu đề", slug: "Đường dẫn", status: "Trạng thái", columns: "Thuộc tính", data: "Nội dung", segment: "Phân khúc", segments: "Phân khúc sản phẩm", kwp: "Công suất (kWp)", featured: "Nổi bật", price: "Giá gốc", salePrice: "Giá giảm", images: "Hình ảnh", image: "Hình ảnh", location: "Địa điểm", detail: "Chi tiết", metrics: "Chỉ số", categoryId: "Mã danh mục", brandId: "Mã thương hiệu", parentId: "Mã danh mục cha", rating: "Điểm đánh giá", group: "Nhóm", kind: "Loại video", source: "Nguồn video", provider: "Nhà cung cấp", idOrSrc: "Mã hoặc đường dẫn video", poster: "Ảnh bìa video", quote: "Nội dung đánh giá", isPrimary: "Chi nhánh chính", question: "Câu hỏi", answer: "Trả lời", body: "Nội dung bài viết", excerpt: "Tóm tắt", cover: "Ảnh bìa", readMinutes: "Thời gian đọc (phút)", specs: "Thông số", warranty: "Bảo hành", tech: "Công nghệ", powerKw: "Công suất (kW)", tags: "Thẻ", coverMediaId: "Mã ảnh bìa", posterMediaId: "Mã ảnh video", logoMediaId: "Mã logo" };
const fieldLabels = Object.fromEntries(Object.entries(labels).flatMap(([key, label]) => [[key, label], [`columns.${key}`, label], [`data.${key}`, label], [`data.source.${key}`, label]]));
const SlugError = createContext<string | undefined>(undefined);
function SlugField({ path, value, label }: FieldProps<string | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const conflict = use(SlugError), id = `${idPrefix}-slug`;
  const error = conflict ?? issues.get("slug")?.[0];
  return <div className="space-y-1">
    <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
    <input id={id} name="slug" autoComplete="off" spellCheck={false} value={value ?? ""} maxLength={200} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      className="min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onChange={event => update(path, event.target.value)} />
    {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
  </div>;
}
const widgets = { slug: SlugField };
export function CollectionForm({ name, initial, bilingual }: { name: Collection; initial: unknown; bilingual: boolean }) {
  const definition = collectionDefs[name], router = useRouter();
  const { id: recordId, ...initialValue } = initial as { id?: string; [key: string]: unknown };
  const [value, setValue] = useState<unknown>(initialValue);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  // The record ID is held outside SchemaForm so it cannot be edited as a content field.
  const schema = useMemo(() => collectionFormSchema(name), [name]);
  const record = value as { id?: string; title?: { vi?: string }; slug?: string; status?: string };
  const save = (data: unknown) => startTransition(async () => {
    const form = new FormData(); form.set("collection", definition.path);
    form.set("payload", JSON.stringify({ ...data as object, ...(recordId ? { id: recordId } : {}) }));
    const response = await saveCollection({}, form); setResult(response);
    if (response.ok) { router.push(`/noi-dung/${definition.path}?saved=1`); router.refresh(); }
  });
  return <section className="min-w-0 space-y-5">
    <Link className="inline-flex min-h-11 items-center rounded-button text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href={`/noi-dung/${definition.path}`}>Về danh sách {definition.label.vi.toLowerCase()}</Link>
    <h1 className="break-words text-2xl font-semibold text-fg">{recordId ? "Sửa" : "Thêm"} {definition.label.vi.toLowerCase()}</h1>
    {record.status === "published" && <p className="rounded-card border border-line/20 bg-bg-tint px-4 py-3 text-sm text-fg-muted">Bản ghi đã xuất bản: lưu là cập nhật ngay lên website.</p>}
    <p className="break-all text-sm text-fg-muted">Để trống đường dẫn để tự tạo: <code className="text-fg">{slugify(record.title?.vi ?? "") || "nhập tiêu đề để gợi ý"}</code>.</p>
    {result.error && <p id="collection-save-error" role="alert" className="text-sm font-medium text-danger">{result.error}</p>}
    <fieldset disabled={pending} aria-busy={pending} className="min-w-0 space-y-4">
      <legend className="sr-only">Thông tin {definition.label.vi.toLowerCase()}</legend>
      <SlugError value={result.status === 409 ? result.error : undefined}>
        <SchemaForm schema={schema} value={value as never} onChange={next => { setValue(next); setResult({}); }} onSubmit={save} bilingual={bilingual} labels={fieldLabels} widgets={widgets} submitLabel={pending ? "Đang lưu…" : "Lưu nội dung"} />
      </SlugError>
    </fieldset>
  </section>;
}
