"use server";
import { revalidatePath } from "next/cache";
import { action, type ActionResult } from "../../../../lib/action.ts";
import { senderHostnameSchema, senderEmptySchema } from "../../../../lib/senderDomain.ts";
import { senderDomainHandlers } from "../../../../lib/senderDomainRuntime.ts";

function refreshed(result: ActionResult) {
  if (result.ok) revalidatePath("/cai-dat/ten-mien-gui");
  return result;
}
export const addSenderDomain = action("email.manage", senderHostnameSchema, async (data, context) => refreshed(await senderDomainHandlers.add(data, context)));
export const checkSenderDomain = action("email.manage", senderEmptySchema, async (data, context) => refreshed(await senderDomainHandlers.check(data, context)));
export const removeSenderDomain = action("email.manage", senderEmptySchema, async (data, context) => refreshed(await senderDomainHandlers.remove(data, context)));
