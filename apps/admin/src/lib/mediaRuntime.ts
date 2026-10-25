import { reserveUpload, completeUpload, cancelUpload, deleteMedia, forTenant } from "@solar/db";
import { storageFor } from "@solar/storage";
import { getRuntime } from "./runtime.ts";
import { createMediaHandlers } from "./media.ts";
import { getSiteEntitlements } from "./entitlements.ts";

export const mediaHandlers = createMediaHandlers({
  canUploadVideo: async () => (await getSiteEntitlements())("videoUpload"),
  storage: storageFor,
  store: {
    get: (tenantId, id) => forTenant(getRuntime().db, tenantId).media.get(id),
    reserve: (tenantId, input, driver) => reserveUpload(getRuntime().db, tenantId, input, driver),
    complete: (tenantId, id) => completeUpload(getRuntime().db, tenantId, id),
    cancel: (tenantId, id) => cancelUpload(getRuntime().db, tenantId, id),
    remove: (tenantId, id, options) => deleteMedia(getRuntime().db, tenantId, id, options),
  },
});
