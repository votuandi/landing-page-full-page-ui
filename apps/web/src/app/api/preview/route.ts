import { draftMode } from "next/headers";
import { consumePreviewToken } from "@solar/db";
import { getWebDb } from "@/lib/tenant/db";
import { createPreviewHandler } from "@/lib/tenant/previewRoute";

export const GET = createPreviewHandler({
  consume: (tenantId, token) => consumePreviewToken(getWebDb(), tenantId, token),
  enableDraft: async () => { (await draftMode()).enable(); },
});
