import { forTenant, mediaVariantsSchema, type Db } from "@solar/db";
import { kindOf } from "@solar/storage";

/** tenantId is resolved from the authenticated admin host before this query. */
export function listMedia(db: Db, tenantId: string) {
  return forTenant(db, tenantId).media.list({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 200,
    select: { id: true, mime: true, size: true, status: true, variants: true, createdAt: true,
      name: true, alt: true, width: true, height: true, visibility: true },
  });
}

export function mediaAlt(alt: unknown): { vi: string; en: string } {
  const value = alt as { vi?: unknown; en?: unknown } | null;
  return { vi: typeof value?.vi === "string" ? value.vi : "", en: typeof value?.en === "string" ? value.en : "" };
}
export function altWarning(row: { mime: string; status: string; alt: unknown }): boolean {
  return row.status === "ready" && kindOf(row.mime) === "image" && !mediaAlt(row.alt).vi.trim();
}
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
export function filterMedia<T extends { mime: string; name: string | null; alt: unknown }>(rows: T[], { q = "", kind = "" }: { q?: string; kind?: string }): T[] {
  const query = normalize(q);
  return rows.filter(row => {
    const matchesKind = !["image", "video", "document"].includes(kind) || (kind === "document" ? row.mime === "application/pdf" : kindOf(row.mime) === kind);
    const alt = mediaAlt(row.alt);
    return matchesKind && (!query || [row.name ?? "", alt.vi, alt.en].some(value => normalize(value).includes(query)));
  });
}

export function mediaStatus(row: { status: string; variants: unknown }): string {
  if (row.status === "quarantine") return "Đang xử lý";
  if (row.status === "failed") return "Lỗi";
  const count = mediaVariantsSchema.safeParse(row.variants).data?.length ?? 0;
  return count ? `Sẵn sàng · ${count} biến thể` : "Sẵn sàng";
}
