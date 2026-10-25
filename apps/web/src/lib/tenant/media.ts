import { z } from "zod";
import { mediaVariantsSchema, type TenantRepo } from "@solar/db";
import { assertKey, storageFor, variantKey, VARIANT_WIDTHS, VARIANT_FORMATS, type StorageKind, type StorageDriver } from "@solar/storage";
import { encodeMediaUrl } from "@solar/ui";
import { mediaSrc, storySource } from "@solar/sections";
import { tenantRepository, siteCanUse, type TenantSite } from "./siteData";

type ObjectData = Record<string, unknown>;
const object = (value: unknown): value is ObjectData => !!value && typeof value === "object" && !Array.isArray(value);
const uuid = (value: unknown): value is string => z.uuid().safeParse(value).success;
const file = (value: unknown): value is ObjectData & { provider: "file"; idOrSrc: string } => object(value) && value.provider === "file" && typeof value.idOrSrc === "string";
const imageRef = (value: unknown): value is ObjectData & { id: string } => object(value) && uuid(value.id) && "alt" in value;
const focalSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

/** Runs only on validated server data; never reads request cookies in cached renders. */
export function createMediaResolver(tenantId: string, storage: Pick<StorageDriver, "publicUrl"> | ((kind: StorageKind) => Pick<StorageDriver, "publicUrl">), canUse: (feature: string) => boolean, repo?: Pick<TenantRepo, "media">) {
  const driver = (kind: StorageKind) => typeof storage === "function" ? storage(kind) : storage;
  const publicKey = (key: string) => {
    try { assertKey(key); return key.startsWith(`tenants/${tenantId}/`); } catch { return false; }
  };
  return async ({ data }: { data: unknown }): Promise<unknown> => {
    const ids = new Set<string>();
    const imageIds = new Set<string>();
    const collect = (value: unknown) => {
      if (file(value) && uuid(value.idOrSrc)) ids.add(value.idOrSrc.toLowerCase());
      if (imageRef(value)) imageIds.add(value.id.toLowerCase());
      if (Array.isArray(value)) value.forEach(collect);
      else if (object(value)) Object.values(value).forEach(collect);
    };
    collect(data);
    const rows = ids.size && canUse("videoUpload") ? await (repo ?? tenantRepository(tenantId)).media.list({ where: {
      id: { in: [...ids] }, status: "ready", visibility: "public", mime: { startsWith: "video/" },
    } }) : [];
    const videos = new Map(rows.filter(row => row.tenantId === tenantId && row.status === "ready" && row.visibility === "public" && row.mime.startsWith("video/") && publicKey(row.key)).map(row => [row.id.toLowerCase(), row]));
    const imageRows = imageIds.size ? await (repo ?? tenantRepository(tenantId)).media.list({ where: {
      id: { in: [...imageIds] }, status: "ready", visibility: "public", mime: { startsWith: "image/" },
    } }) : [];
    const images = new Map(imageRows.filter(row => row.tenantId === tenantId && row.status === "ready" && row.visibility === "public" && row.mime.startsWith("image/") && publicKey(row.key)).map(row => [row.id.toLowerCase(), row]));
    const visit = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(visit).filter(item => item !== undefined);
      if (!object(value)) return value;
      if (file(value)) {
        if (!uuid(value.idOrSrc)) return storySource.safeParse(value).success ? value : undefined;
        const video = videos.get(value.idOrSrc.toLowerCase());
        return video ? { ...value, idOrSrc: driver(video.driver).publicUrl(video.key) } : undefined;
      }
      const result: ObjectData = {};
      for (const [key, item] of Object.entries(value)) {
        const resolved = visit(item);
        // A story without its required source disappears; optional video does not hide its parent.
        if (resolved === undefined && key === "source") return undefined;
        if (resolved !== undefined) result[key] = resolved;
      }
      if (imageRef(value)) {
        const image = images.get(value.id.toLowerCase());
        if (image) {
          const storage = driver(image.driver);
          result.id = storage.publicUrl(image.key);
          const variants = mediaVariantsSchema.safeParse(image.variants).data ?? [];
          const expected = variants.length === 6 && /\.[a-z0-9]+$/i.test(image.key) ? VARIANT_WIDTHS.map(width => VARIANT_FORMATS.map(format =>
            variants.find(v => v.key === variantKey(image.key, width, format) && v.format === format && publicKey(v.key)))) : [];
          if (expected.length === 3 && expected.every((pair, i) => pair.every(Boolean) && pair[0]!.width === pair[1]!.width && pair[0]!.width <= VARIANT_WIDTHS[i] && (i === 0 || pair[0]!.width >= expected[i - 1][0]!.width))) {
            const widths = expected.map(pair => pair[0]!.width) as [number, number, number];
            const focal = focalSchema.safeParse(value.focal ?? image.focal).data;
            result.id = encodeMediaUrl(storage.publicUrl(variantKey(image.key, 1920, "webp")), widths, focal);
          }
        }
      }
      const source = value.source ?? value.video;
      if (file(source) && uuid(source.idOrSrc) && object(result.poster) && typeof result.poster.id === "string" && !mediaSrc(result.poster as { id: string; alt: { vi: string } })) {
        const video = videos.get(source.idOrSrc.toLowerCase());
        const variants = mediaVariantsSchema.safeParse(video?.variants).data ?? [];
        const poster = variants.find(v => v.format === "webp" && v.key.endsWith("-w640.webp") && publicKey(v.key));
        if (poster && video) result.poster = { ...result.poster, id: driver(video.driver).publicUrl(poster.key) };
      }
      return result;
    };
    return visit(data);
  };
}

export function tenantMediaResolver(site: TenantSite) {
  // Storage configuration is needed only when a Media UUID resolves, not on static pages.
  return createMediaResolver(site.tenantId, storageFor, siteCanUse(site));
}
