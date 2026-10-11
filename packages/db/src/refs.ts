const collectionModels = {
  projects: "project", stories: "story", testimonials: "testimonial", posts: "post",
  products: "product", branches: "branch", faqs: "faq", brands: "brand",
  certificates: "certificate", press: "pressItem", services: "service", productCategories: "productCategory",
} as const;
export type CollectionName = keyof typeof collectionModels;
export type TenantRefs = { media?: string[]; collections?: Partial<Record<CollectionName, string[]>> };
export type RefDb = Record<"media" | (typeof collectionModels)[CollectionName], {
  findMany(args: { where: { tenantId: string; id: { in: string[] } }; select: { id: true } }): Promise<{ id: string }[]>;
}>;
type MissingRefs = { kind: string; ids: string[] }[];

export class CrossTenantRefError extends Error {
  constructor(readonly missing: MissingRefs) {
    super(`Refs outside tenant: ${missing.map(({ kind, ids }) => `${kind}: ${ids.join(", ")}`).join("; ")}`);
    this.name = "CrossTenantRefError";
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function assertRefsBelongToTenant(db: RefDb, tenantId: string, refs: TenantRefs): Promise<void> {
  const missing: MissingRefs = [];
  const groups: [string, keyof RefDb, string[]][] = [
    ["media", "media", (refs.media ?? []).filter((id) => !(id.startsWith("/") && !id.startsWith("//")))],
    ...Object.entries(refs.collections ?? {}).map(([kind, ids]): [string, keyof RefDb, string[]] => [
      kind, collectionModels[kind as CollectionName], ids,
    ]),
  ];
  for (const [kind, model, rawIds] of groups) {
    const ids = [...new Set(rawIds.map((id) => uuid.test(id) ? id.toLowerCase() : id))];
    if (!ids.length) continue;
    const valid = ids.filter((id) => uuid.test(id));
    const rows = valid.length ? await db[model].findMany({
      where: { tenantId, id: { in: valid } }, select: { id: true },
    }) : [];
    const found = new Set(rows.map(({ id }) => id));
    const absent = ids.filter((id) => !found.has(id));
    if (absent.length) missing.push({ kind, ids: absent });
  }
  if (missing.length) throw new CrossTenantRefError(missing);
}
