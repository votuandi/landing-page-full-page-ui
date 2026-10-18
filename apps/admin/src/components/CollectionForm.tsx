"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SchemaForm } from "@solar/cms-ui";
import { collectionDefs, collectionFormSchema, slugify, type Collection } from "@solar/db/collections";
import type { ActionResult } from "../lib/action.ts";
import { saveCollection } from "../app/(admin)/noi-dung/actions.ts";
import type { CollectionReferences } from "../lib/collections.ts";
import { CollectionFieldOptions, collectionWidgets } from "./CollectionWidgets.tsx";

const labels = { title: "Tiêu đề", slug: "Đường dẫn", status: "Trạng thái", columns: "Thuộc tính", data: "Nội dung", segment: "Phân khúc", segments: "Phân khúc sản phẩm", kwp: "Công suất (kWp)", featured: "Nổi bật", price: "Giá gốc", salePrice: "Giá giảm", images: "Hình ảnh", image: "Hình ảnh", location: "Địa điểm", detail: "Chi tiết", metrics: "Chỉ số", categoryId: "Danh mục", brandId: "Thương hiệu", parentId: "Danh mục cha", rating: "Điểm đánh giá", group: "Nhóm", kind: "Loại video", source: "Nguồn video", provider: "Nhà cung cấp", idOrSrc: "Mã hoặc đường dẫn video", poster: "Ảnh bìa video", quote: "Nội dung đánh giá", isPrimary: "Chi nhánh chính", question: "Câu hỏi", answer: "Trả lời", body: "Nội dung bài viết", excerpt: "Tóm tắt", cover: "Ảnh bìa", readMinutes: "Thời gian đọc (phút)", specs: "Thông số", warranty: "Bảo hành", tech: "Công nghệ", powerKw: "Công suất (kW)", tags: "Thẻ", coverMediaId: "Mã ảnh bìa", posterMediaId: "Mã ảnh video", logoMediaId: "Mã logo" };
const fieldLabels = Object.fromEntries(Object.entries(labels).flatMap(([key, label]) => [[key, label], [`columns.${key}`, label], [`data.${key}`, label], [`data.source.${key}`, label]]));
export function CollectionForm({ name, initial, bilingual, references }: { name: Collection; initial: unknown; bilingual: boolean; references: CollectionReferences }) {
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
      <CollectionFieldOptions value={{ references, slugError: result.status === 409 ? result.error : undefined }}>
        <SchemaForm schema={schema} value={value as never} onChange={next => { setValue(next); setResult({}); }} onSubmit={save} bilingual={bilingual} labels={fieldLabels} widgets={collectionWidgets(name)} submitLabel={pending ? "Đang lưu…" : "Lưu nội dung"} />
      </CollectionFieldOptions>
    </fieldset>
  </section>;
}
