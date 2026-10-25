import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collectRefs, collectionSchemas, pageConfigSchema, sectionRegistry } from "@solar/sections";
import { canUse, limit, PLAN_IDS } from "@solar/plans";
import { getPreset, presetStructure, siteStructureOf, validateSiteStructure } from "@solar/presets";
import { COLLECTIONS, collectionDefs } from "./collections.ts";
import { collectionRepository, publishItemMedia } from "./collectionWrite.ts";
import { createTenantRepo } from "./repository.ts";
import { publishMedia } from "./media.ts";
import { siteProfileMediaIds } from "./siteProfile.ts";
import { checkConnection, loadDisabledFeatures, platformClient, type Db, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { assertRefsBelongToTenant, CrossTenantRefError } from "./refs.ts";
import { Prisma } from "../generated/client.ts";
import { defaultDriver, type StorageKind } from "@solar/storage";
import { backupMediaReferenceIds } from "./mediaRetention.ts";

export const BACKUP_FORMAT = "solar-tenant-backup";
const uuid = z.uuid(), date = z.iso.datetime(), json = z.json();
const identity = { id: uuid, createdAt: date };
const timestamps = { ...identity, updatedAt: date };
const ref = uuid.nullable().optional();
const common = { ...timestamps, slug: z.string(), status: z.enum(["draft", "published"]), order: z.int(), title: json, data: json, publishedAt: date.nullable().optional() };
const collectionShapes = {
  product: z.strictObject({ ...common, categoryId: ref, brandId: ref, price: z.int().nullable().optional(), salePrice: z.int().nullable().optional(), featured: z.boolean().optional(), segments: z.array(z.string()).optional() }),
  productCategory: z.strictObject({ ...common, parentId: ref }),
  brand: z.strictObject({ ...common, logoMediaId: ref }),
  project: z.strictObject({ ...common, segment: z.string().nullable().optional(), kwp: z.number().nullable().optional(), featured: z.boolean().optional(), coverMediaId: ref }),
  post: z.strictObject({ ...common, segment: z.string().nullable().optional(), coverMediaId: ref, tags: z.array(z.string()).optional() }),
  story: z.strictObject({ ...common, segment: z.string().nullable().optional(), kind: z.string().nullable().optional(), posterMediaId: ref }),
  testimonial: z.strictObject({ ...common, segment: z.string().nullable().optional(), rating: z.number().nullable().optional() }),
  branch: z.strictObject({ ...common, isPrimary: z.boolean().optional() }),
  faq: z.strictObject({ ...common, group: z.string().nullable().optional() }),
  service: z.strictObject(common), certificate: z.strictObject(common), pressItem: z.strictObject(common),
};
export const tenantBackupSchema = z.strictObject({
  format: z.literal(BACKUP_FORMAT), version: z.literal(1), exportedAt: date,
  source: z.strictObject({ tenantId: uuid, slug: z.string() }),
  site: z.strictObject({ ...timestamps, name: z.string(), themeId: z.string(), presetId: z.string().nullable(), themeOverrides: json,
    pageTypes: z.array(z.string()), locales: z.array(z.string()), defaultLocale: z.string(), profile: json, widgets: json, seo: json }),
  pages: z.array(z.strictObject({ ...timestamps, siteId: uuid, slug: z.string(), kind: z.enum(["home", "system", "landing"]), title: json,
    sections: json, draftSections: json, revision: z.int().nonnegative(), publishedAt: date.nullable() })),
  pageVersions: z.array(z.strictObject({ ...identity, pageId: uuid, revision: z.int().nonnegative(), snapshot: json,
    publishedBySiteUserId: z.null(), publishedByPlatformAdminId: z.null() })),
  sectionContents: z.array(z.strictObject({ ...timestamps, siteId: uuid, pageId: uuid, sectionId: z.string(), type: z.string(),
    schemaVersion: z.int().nonnegative(), data: json, draftData: json, removedAt: date.nullable(), revision: z.int().nonnegative() })),
  collections: z.strictObject({ product: z.array(collectionShapes.product), productCategory: z.array(collectionShapes.productCategory),
    brand: z.array(collectionShapes.brand), project: z.array(collectionShapes.project), post: z.array(collectionShapes.post),
    story: z.array(collectionShapes.story), testimonial: z.array(collectionShapes.testimonial), branch: z.array(collectionShapes.branch),
    faq: z.array(collectionShapes.faq), service: z.array(collectionShapes.service), certificate: z.array(collectionShapes.certificate), pressItem: z.array(collectionShapes.pressItem) }),
  media: z.array(z.strictObject({ ...identity, key: z.string(), driver: z.enum(["local", "s3"]), visibility: z.enum(["public", "private"]),
    status: z.enum(["quarantine", "ready", "failed"]), mime: z.string(), size: z.int().nonnegative(), width: z.int().nullable().optional(),
    height: z.int().nullable().optional(), variants: json.optional(), alt: json.optional(), name: z.string().nullable().optional(), focal: json.optional() })),
});
export type TenantBackup = z.infer<typeof tenantBackupSchema>;
export class TenantBackupError extends Error {
  constructor(message = "Bản sao lưu không hợp lệ hoặc phiên bản chưa được hỗ trợ", readonly status = 400) { super(message); }
}
export type BackupStorage = {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, body: Uint8Array, options: { contentType: string }): Promise<void>;
  delete(key: string): Promise<void>;
};
const records = (b: TenantBackup) => [b.site, ...b.pages, ...b.pageVersions, ...b.sectionContents, ...b.media, ...COLLECTIONS.flatMap(name => b.collections[name])];
const validKey = (key: string, tenantId: string) => ["tenants", "private"].some(prefix => key.startsWith(`${prefix}/${tenantId}/`)) &&
  key.split("/").every(part => /^[a-zA-Z0-9_.-]+$/.test(part) && part !== "." && part !== "..");

export function parseTenantBackup(raw: unknown): TenantBackup {
  let value = raw;
  if (typeof raw === "string") { try { value = JSON.parse(raw); } catch { throw new TenantBackupError(); } }
  const result = tenantBackupSchema.safeParse(value);
  if (!result.success) throw new TenantBackupError();
  const bundle = result.data, ids = records(bundle).map(row => row.id.toLowerCase());
  if (new Set(ids).size !== ids.length || bundle.media.some(media => !validKey(media.key, bundle.source.tenantId))) throw new TenantBackupError();
  return bundle;
}

/** Exact UUID values only; embedded URLs keep their host and receive the new tenant key. */
export function remapBackup(bundle: TenantBackup, tenantId: string): TenantBackup {
  const ids = new Map(records(bundle).map(row => [row.id.toLowerCase(), randomUUID()]));
  function walk(value: unknown): unknown {
    if (typeof value === "string") return ids.get(value.toLowerCase()) ?? value
      .replaceAll(`tenants/${bundle.source.tenantId}/`, `tenants/${tenantId}/`)
      .replaceAll(`private/${bundle.source.tenantId}/`, `private/${tenantId}/`);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, walk(child)]));
    return value;
  }
  return walk(bundle) as TenantBackup;
}

export async function exportTenant(db: Db | PlatformDb, tenantId: string): Promise<TenantBackup> {
  // Runtime cannot read Tenant through RLS; its Site relation is permitted in a tenant transaction.
  return withTenantTransaction(db, tenantId, async repo => {
    const site = await repo.site.first({ include: { tenant: { select: { slug: true } } } });
    if (!site) throw new TenantBackupError("Không tìm thấy website", 404);
    const strip = (row: object) => { const { tenantId: _tenant, orphanedAt: _orphaned, ...rest } = row as Record<string, unknown>; return rest; };
    const pages = await repo.page.list({ orderBy: { slug: "asc" } });
    const pageSlug = new Map(pages.map(page => [page.id, page.slug]));
    const orderPage = (a: { pageId: string }, b: { pageId: string }) => (pageSlug.get(a.pageId) ?? "").localeCompare(pageSlug.get(b.pageId) ?? "");
    const sections = (await repo.sectionContent.list()).sort((a, b) => orderPage(a, b) || a.sectionId.localeCompare(b.sectionId));
    const versions = (await repo.pageVersion.list()).sort((a, b) => orderPage(a, b) || a.revision - b.revision);
    const collections = Object.fromEntries(await Promise.all(COLLECTIONS.map(async name => [name,
      (await collectionRepository(repo, name).list({ orderBy: [{ order: "asc" }, { slug: "asc" }] })).map(strip)])));
    const { tenant: source, ...siteData } = site;
    return parseTenantBackup(JSON.parse(JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(),
      source: { tenantId, slug: source.slug }, site: strip(siteData), pages: pages.map(strip), sectionContents: sections.map(strip),
      pageVersions: versions.map(row => ({ ...strip(row), publishedBySiteUserId: null, publishedByPlatformAdminId: null })),
      collections, media: (await repo.media.list({ where: { status: "ready" }, orderBy: { key: "asc" } })).map(strip),
    })));
  }, { isolationLevel: "RepeatableRead", timeout: 30_000 });
}

const collectionNames = { product: "products", project: "projects", post: "posts", story: "stories", testimonial: "testimonials", branch: "branches" } as const;
const restoreOptions = z.strictObject({ slug: z.string().min(1).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().trim().min(1).max(200).optional(), planId: z.enum(PLAN_IDS) });
const snapshotSchema = z.object({ contents: z.array(z.object({ type: z.string(), data: z.unknown() })) });
const descriptors = (value: unknown) => pageConfigSchema.parse({ sections: Array.isArray(value)
  ? value.map(section => ({ ...section as object, data: undefined })) : value }).sections;

export async function restoreTenant(db: PlatformDb, storage: BackupStorage, raw: unknown, options: z.input<typeof restoreOptions>, routing?: { source(kind: StorageKind): BackupStorage; driver: StorageKind }) {
  const bundle = parseTenantBackup(raw), parsed = restoreOptions.safeParse(options);
  if (!parsed.success) throw new TenantBackupError("Thông tin website khôi phục không hợp lệ");
  const input = parsed.data, client = platformClient(db);
  await checkConnection(db);
  if (await client.tenant.findUnique({ where: { slug: input.slug }, select: { id: true } })) throw new TenantBackupError("Tên website đã tồn tại", 409);
  const tenantId = randomUUID(), mapped = remapBackup(bundle, tenantId), copied: string[] = [];
  const referenced = backupMediaReferenceIds(bundle), skippedIds = new Set<string>(), driver = routing?.driver ?? defaultDriver();
  const disabled = await loadDisabledFeatures(db);
  try {
    // Variants are separate stored files too; only keys owned by the source tenant may be read.
    for (const media of bundle.media) {
      const keys = new Set<string>([media.key]);
      const visit = (value: unknown): void => {
        if (typeof value === "string" && /(?:tenants|private)\//.test(value)) {
          const key = value.slice(value.search(/(?:tenants|private)\//));
          if (!validKey(key, bundle.source.tenantId)) throw new TenantBackupError("Bản sao lưu chứa khóa media ngoài website nguồn");
          keys.add(key);
        } else if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") Object.values(value).forEach(visit);
      };
      visit(media.variants);
      const source = routing?.source(media.driver) ?? storage;
      // Check all files before copying this row, so skipping an unused row never leaves partial objects.
      const objects: { key: string; bytes: Uint8Array }[] = [];
      for (const key of keys) {
        const bytes = await source.get(key);
        if (bytes === null) {
          if (referenced.has(media.id.toLowerCase())) throw new TenantBackupError("Không tìm thấy tệp media của bản sao lưu");
          skippedIds.add(media.id); break;
        }
        objects.push({ key, bytes });
      }
      if (skippedIds.has(media.id)) continue;
      for (const { key, bytes } of objects) {
        const target = key.replace(`tenants/${bundle.source.tenantId}/`, `tenants/${tenantId}/`).replace(`private/${bundle.source.tenantId}/`, `private/${tenantId}/`);
        copied.push(target); // Clean partial writes as well as successful ones.
        await storage.put(target, bytes, { contentType: media.mime });
      }
    }
    await client.$transaction(async tx => {
      const tenant = await tx.tenant.create({ data: { id: tenantId, slug: input.slug, name: input.name ?? mapped.site.name, planId: input.planId, status: "trial", storageDriver: driver } });
      const can = canUse(tenant, { disabled });
      const preset = getPreset(mapped.site.presetId ?? mapped.site.themeId);
      if (!preset) throw new TenantBackupError("Bản sao lưu chứa preset không hợp lệ");
      const baseline = presetStructure(preset, can);
      const structure = (draft: boolean) => siteStructureOf(mapped.site, mapped.pages.map(page => ({ slug: page.slug,
        sections: descriptors(draft ? page.draftSections ?? page.sections : page.sections) })));
      for (const draft of [false, true]) {
        const proposed = structure(draft);
        const issues = validateSiteStructure(proposed, { can, pagesLimit: limit(tenant, "pages"), baseline });
        if (issues.length) throw new TenantBackupError(`Bản sao lưu không phù hợp gói: ${issues.join("; ")}`);
        for (const section of proposed.pages.flatMap(page => page.sections)) if (!sectionRegistry.variantsOf(section.type)?.includes(section.variant)) throw new TenantBackupError("Bản sao lưu chứa section không hợp lệ");
      }
      // The bundle is schema-validated; this boundary normalizes nullable Prisma JSON fields.
      async function insert(name: "site" | "page" | "pageVersion" | "sectionContent" | "media" | typeof COLLECTIONS[number], row: object) {
        const data: Record<string, unknown> = { ...row, tenantId };
        for (const field of ["draftSections", "draftData", "variants", "alt", "focal"]) if (data[field] === null) data[field] = Prisma.DbNull;
        for (const field of ["title", "themeOverrides", "profile", "widgets", "seo", "sections", "snapshot", "data"]) {
          if (data[field] === null) data[field] = field === "title" && name === "page" ? Prisma.DbNull : Prisma.JsonNull;
        }
        const delegate = tx[name] as unknown as { create(input: { data: Record<string, unknown> }): Promise<unknown> };
        await delegate.create({ data });
      }
      const retained = bundle.media.map((row, index) => skippedIds.has(row.id) ? null : mapped.media[index]).filter(row => row !== null);
      for (const row of retained) await insert("media", { ...row, driver });
      const pending = [...mapped.collections.productCategory], inserted = new Set<string>();
      while (pending.length) {
        const index = pending.findIndex(row => !row.parentId || inserted.has(row.parentId));
        if (index < 0) throw new TenantBackupError("Bản sao lưu chứa cây danh mục không hợp lệ");
        const [row] = pending.splice(index, 1); await insert("productCategory", row); inserted.add(row.id);
      }
      for (const name of ["brand", ...COLLECTIONS.filter(name => name !== "productCategory" && name !== "brand")] as const) {
        for (const row of mapped.collections[name]) await insert(name, row);
      }
      await insert("site", mapped.site);
      for (const row of mapped.pages) await insert("page", row);
      for (const row of mapped.sectionContents) await insert("sectionContent", row);
      for (const row of mapped.pageVersions) await insert("pageVersion", row);
      const checkSection = async (row: { type: string; data: unknown; draftData?: unknown }) => {
        const def = sectionRegistry.getType(row.type);
        if (!def) throw new TenantBackupError("Bản sao lưu chứa loại section không hợp lệ");
        for (const value of [row.data, row.draftData]) await assertRefsBelongToTenant(tx, tenantId, collectRefs(def.schema, value));
      };
      for (const row of mapped.sectionContents) await checkSection(row);
      for (const version of mapped.pageVersions) for (const row of snapshotSchema.parse(version.snapshot).contents) await checkSection(row);
      for (const name of COLLECTIONS) for (const row of mapped.collections[name]) {
        await assertRefsBelongToTenant(tx, tenantId, collectRefs(collectionDefs[name].data, row.data));
        if (Object.hasOwn(collectionNames, name)) await assertRefsBelongToTenant(tx, tenantId,
          collectRefs(collectionSchemas[collectionNames[name as keyof typeof collectionNames]], row.data));
        // DB collection image fields also accept a bare media UUID (public section schemas use { id }).
        const data = row.data as Record<string, unknown> | null;
        const images = name === "product" ? data?.images : [data?.image, data?.cover, data?.poster];
        if (Array.isArray(images)) await assertRefsBelongToTenant(tx, tenantId, { media: images.filter((id): id is string => typeof id === "string" && uuid.safeParse(id).success) });
      }
      const repo = createTenantRepo(tx, tenantId);
      const livePages = new Map(mapped.pages.filter(page => page.publishedAt).map(page => [page.id, descriptors(page.sections)]));
      const liveMedia = mapped.sectionContents.flatMap(row => livePages.get(row.pageId)?.some(section => section.id === row.sectionId)
        ? collectRefs(sectionRegistry.getType(row.type)!.schema, row.data).media : []);
      await publishMedia(repo, [...siteProfileMediaIds(mapped.site.profile), ...liveMedia]);
      for (const name of COLLECTIONS) for (const row of mapped.collections[name]) await publishItemMedia(repo, name, row);
      await tx.auditLog.create({ data: { tenantId, actorType: "system", action: "tenant.backup.restore", entity: "Tenant", entityId: tenantId,
        data: { sourceSlug: bundle.source.slug, counts: { pages: mapped.pages.length, sections: mapped.sectionContents.length,
          media: retained.length, skipped: skippedIds.size, ...Object.fromEntries(COLLECTIONS.map(name => [name, mapped.collections[name].length])) } } } });
    }, { timeout: 30_000 });
  } catch (error) {
    await Promise.allSettled([...new Set(copied)].map(key => storage.delete(key)));
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new TenantBackupError("Tên website hoặc dữ liệu bị trùng", 409);
    if (error instanceof CrossTenantRefError || error && typeof error === "object" && "code" in error && error.code === "P2003") throw new TenantBackupError("Bản sao lưu chứa tham chiếu không thuộc website");
    if (error instanceof z.ZodError) throw new TenantBackupError();
    throw error;
  }
  return { tenantId, slug: input.slug, skipped: skippedIds.size };
}
