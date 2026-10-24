import { forTenant, mediaVariantsSchema, type Db } from "@solar/db";

/** tenantId is resolved from the authenticated admin host before this query. */
export function listMedia(db: Db, tenantId: string) {
  return forTenant(db, tenantId).media.list({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50,
    select: { id: true, mime: true, size: true, status: true, variants: true, createdAt: true },
  });
}

export function mediaStatus(row: { status: string; variants: unknown }): string {
  if (row.status === "quarantine") return "Đang xử lý";
  if (row.status === "failed") return "Lỗi";
  const count = mediaVariantsSchema.safeParse(row.variants).data?.length ?? 0;
  return count ? `Sẵn sàng · ${count} biến thể` : "Sẵn sàng";
}
