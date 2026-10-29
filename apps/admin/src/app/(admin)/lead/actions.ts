"use server";
import { revalidatePath } from "next/cache";
import { action, type ActionResult } from "../../../lib/action.ts";
import { idSchema, resendSchema, updateSchema } from "../../../lib/leadInbox.ts";
import { leadInboxHandlers } from "../../../lib/leadInboxRuntime.ts";

async function refresh(result: ActionResult) { if (result.ok) revalidatePath("/lead"); return result; }
export const updateLead = action("leads.manage", updateSchema, async (input, context) => refresh(await leadInboxHandlers.update(input, context)));
export const deleteLead = action("leads.manage", idSchema, async (input, context) => refresh(await leadInboxHandlers.remove(input, context)));
export const resendLead = action("leads.manage", resendSchema, async (input, context) => refresh(await leadInboxHandlers.resend(input, context)));
