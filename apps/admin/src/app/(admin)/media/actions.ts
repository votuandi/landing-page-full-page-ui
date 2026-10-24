"use server";

import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteMedia, updateMediaMeta, MediaError } from "@solar/db";
import { storageFromEnv } from "@solar/storage";
import { action } from "../../../lib/action.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { removeMediaObjects } from "../../../lib/media.ts";

function mediaFailure(error: unknown) {
  if (!(error instanceof MediaError)) throw error;
  if (error.status === 404) notFound();
  return { ok: false, status: error.status, error: error.message };
}
const idSchema = z.object({ id: z.uuid() });
export const saveMedia = action("media.manage", idSchema.extend({ vi: z.string(), en: z.string().optional(), x: z.string().optional(), y: z.string().optional() }), async (input, { tenantId }) => {
  try {
    const focal = input.x !== undefined && input.y !== undefined ? { x: Number(input.x), y: Number(input.y) } : undefined;
    await updateMediaMeta(getRuntime().db, tenantId, input.id, { alt: { vi: input.vi, en: input.en }, ...(focal ? { focal } : {}) });
    revalidatePath("/media", "layout");
    return { ok: true, message: "Đã lưu thông tin media." };
  } catch (error) { return mediaFailure(error); }
});
export const removeMedia = action("media.manage", idSchema.extend({ confirm: z.literal("on").optional() }), async (input, { tenantId }) => {
  try {
    const { keys } = await deleteMedia(getRuntime().db, tenantId, input.id, { confirm: input.confirm === "on" });
    await removeMediaObjects(storageFromEnv(), keys);
  } catch (error) { return mediaFailure(error); }
  revalidatePath("/media", "layout");
  redirect("/media");
});
