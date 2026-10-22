"use server";

import { action } from "../../../lib/action.ts";
import { createPageSectionHandlers, pageIdSchema, pageRevisionSchema, saveContentSchema, saveSectionsSchema } from "../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../lib/pageSectionRuntime.ts";
import { revalidatePath } from "next/cache";
import { setPageTypes } from "@solar/db";
import { getRuntime } from "../../../lib/runtime.ts";
import { getTenant } from "../../../lib/auth.ts";
import { createPageTypeHandler, pageTypeSchema } from "../../../lib/pageTypes.ts";

const handlers = createPageSectionHandlers(pageSectionDeps);
export const saveSectionsDraft = action("pages.structure", saveSectionsSchema, handlers.save);
export const publishSections = action("pages.publish", pageRevisionSchema, handlers.publish);
export const previewLink = action("pages.view", pageIdSchema, handlers.preview);
export const saveSectionContent = action("content.edit", saveContentSchema, handlers.saveContent);
const setType = createPageTypeHandler({ tenant: getTenant, set: (tenantId, input) => setPageTypes(getRuntime().db, tenantId, input) });
export const setPageType = action("pages.structure", pageTypeSchema, async (input, context) => {
  const result = await setType(input, context);
  if (result.ok) revalidatePath("/trang");
  return result;
});
