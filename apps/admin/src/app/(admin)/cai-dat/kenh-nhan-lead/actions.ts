"use server";
import { revalidatePath } from "next/cache";
import { action, type ActionResult } from "../../../../lib/action.ts";
import { channelSaveSchema, channelIdSchema } from "../../../../lib/leadChannels.ts";
import { leadChannelHandlers } from "../../../../lib/leadChannelsRuntime.ts";

async function refreshed(result: ActionResult) {
  if (result.ok) revalidatePath("/cai-dat/kenh-nhan-lead");
  return result;
}
export const saveChannel = action("settings.manage", channelSaveSchema, async (data, context) => refreshed(await leadChannelHandlers.save(data, context)));
export const toggleChannel = action("settings.manage", channelIdSchema, async (data, context) => refreshed(await leadChannelHandlers.toggle(data, context)));
export const deleteChannel = action("settings.manage", channelIdSchema, async (data, context) => refreshed(await leadChannelHandlers.remove(data, context)));
export const testChannel = action("settings.manage", channelIdSchema, leadChannelHandlers.test);
