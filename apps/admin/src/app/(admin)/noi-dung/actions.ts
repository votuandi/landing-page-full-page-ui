"use server";

import { revalidatePath } from "next/cache";
import { action } from "../../../lib/action.ts";
import { createCollectionHandlers, saveCollectionSchema, collectionIdSchema, reorderCollectionSchema } from "../../../lib/collections.ts";
import { collectionDeps } from "../../../lib/collectionRuntime.ts";

const handlers = createCollectionHandlers(collectionDeps);
const refresh = <T extends { collection: string }>(handler: (input: T, context: import("../../../lib/action.ts").ActionContext) => Promise<import("../../../lib/action.ts").ActionResult>) =>
  async (input: T, context: import("../../../lib/action.ts").ActionContext) => {
    const result = await handler(input, context);
    if (result.ok) revalidatePath("/noi-dung", "layout");
    return result;
  };
export const saveCollection = action("content.edit", saveCollectionSchema, refresh(handlers.save));
export const duplicateCollection = action("content.edit", collectionIdSchema, refresh(handlers.duplicate));
export const removeCollection = action("content.edit", collectionIdSchema, refresh(handlers.remove));
export const sortCollection = action("content.edit", reorderCollectionSchema, refresh(handlers.reorder));
