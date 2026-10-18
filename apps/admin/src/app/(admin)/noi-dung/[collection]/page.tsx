import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCollectionList, collectionTitle, parseCollectionQuery, type CollectionQuery } from "../../../../lib/collections.ts";
import { collectionDeps } from "../../../../lib/collectionRuntime.ts";
import { CollectionList } from "../../../../components/CollectionList.tsx";

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<CollectionQuery & { saved?: string }> }) {
  const [{ collection }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parseCollectionQuery(rawQuery);
  const data = await loadCollectionList(collection, query, collectionDeps);
  if (!data) notFound();
  const { definition, rows, canReorder, limited, filterKey, filterOptions } = data;
  const inputClass = "min-h-11 min-w-0 rounded-input border border-line/20 bg-bg px-3 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return <section className="min-w-0 space-y-6">
    <Link href="/noi-dung" className="inline-flex min-h-11 items-center rounded-button text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Về Nội dung</Link>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="break-words text-2xl font-semibold text-fg">{definition.label.vi}</h1>
      <Link href={`/noi-dung/${collection}/moi`} className="inline-flex min-h-11 items-center rounded-button bg-primary px-4 text-sm font-medium text-on-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Thêm {definition.label.vi.toLowerCase()}</Link>
    </div>
    {rawQuery.saved === "1" && <p role="status" className="rounded-card border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">Đã lưu nội dung</p>}
    <form method="get" role="search" aria-label={`Tìm ${definition.label.vi.toLowerCase()}`} className="flex flex-wrap items-end gap-3 rounded-card border border-line/15 bg-bg-elevated p-4">
      <label className="grid min-w-0 flex-1 basis-full gap-1 text-sm text-fg sm:basis-60">Tìm kiếm<input className={inputClass} name="q" defaultValue={query.q} maxLength={200} placeholder="Tiêu đề hoặc đường dẫn" /></label>
      <label className="grid gap-1 text-sm text-fg">Trạng thái<select className={inputClass} name="status" defaultValue={query.status ?? ""}>
        <option value="">Tất cả</option><option value="draft">Nháp</option><option value="published">Đã xuất bản</option>
      </select></label>
      {definition.filters?.length ? <>
        <label className="grid gap-1 text-sm text-fg">Lọc theo<select className={inputClass} name="filterKey" defaultValue={filterKey}>{definition.filters.map(key => <option key={key} value={key}>{({ segment: "Phân khúc", categoryId: "Danh mục", group: "Nhóm", kind: "Loại video" } as Record<string, string>)[key] ?? key}</option>)}</select></label>
        <label className="grid gap-1 text-sm text-fg">Giá trị lọc<select className={inputClass} name="filter" defaultValue={query.filter ?? ""}><option value="">Tất cả</option>{filterOptions.map(({ value, label }) => <option key={value} value={value}>{filterKey === "categoryId" ? label : ({ household: "Gia đình", shop: "Cửa hàng", factory: "Nhà máy", farm: "Nông trại", progress: "Đang thi công", done: "Hoàn thành", customer: "Khách hàng" } as Record<string, string>)[value] ?? label}</option>)}</select></label>
      </> : null}
      <button className={`${inputClass} px-4 text-sm font-medium hover:bg-bg-tint`} type="submit">Áp dụng</button>
      <Link className="inline-flex min-h-11 items-center rounded-button px-2 text-sm text-fg-muted underline hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href={`/noi-dung/${collection}`}>Xóa bộ lọc</Link>
    </form>
    {limited && <p className="text-sm text-fg-muted">Hiển thị tối đa 500 bản ghi. Sắp xếp tạm tắt vì danh sách chưa đầy đủ.</p>}
    <CollectionList key={JSON.stringify(query)} path={collection} canReorder={canReorder} rows={rows.map(row => ({ id: row.id, slug: row.slug, title: collectionTitle(row), status: row.status }))} />
  </section>;
}
