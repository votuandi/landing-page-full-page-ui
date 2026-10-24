import { reserveUpload, completeUpload, cancelUpload, forTenant } from "@solar/db";
import { storageFromEnv } from "@solar/storage";
import { getRuntime } from "./runtime.ts";
import { createMediaHandlers } from "./media.ts";

export const mediaHandlers = createMediaHandlers({
  storage: () => storageFromEnv(),
  store: {
    get: (tenantId, id) => forTenant(getRuntime().db, tenantId).media.get(id),
    reserve: (tenantId, input, driver) => reserveUpload(getRuntime().db, tenantId, input, driver),
    complete: (tenantId, id) => completeUpload(getRuntime().db, tenantId, id),
    cancel: (tenantId, id) => cancelUpload(getRuntime().db, tenantId, id),
  },
});
