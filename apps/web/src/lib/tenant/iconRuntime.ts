import sharp from "sharp";
import { storageFromEnv } from "@solar/storage";
import { createIconHandler } from "./icon";
import { loadTenantSite, tenantRepository } from "./siteData";

export const resizeIcon = (bytes: Uint8Array, size: number) => sharp(bytes).resize(size, size, { fit: "cover" }).png().toBuffer();

export const tenantIcon = createIconHandler({
  loadSite: loadTenantSite,
  media: (tenantId, id) => tenantRepository(tenantId).media.get(id),
  storage: { get: key => storageFromEnv().get(key) },
  resize: resizeIcon,
});
