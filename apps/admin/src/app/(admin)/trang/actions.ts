"use server";

import { action } from "../../../lib/action.ts";
import { createPageSectionHandlers, pageIdSchema, pageRevisionSchema, restoreVersionSchema, presenceSchema, saveContentSchema, saveSectionsSchema } from "../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../lib/pageSectionRuntime.ts";
import { revalidatePath } from "next/cache";
import { setPageTypes, createLandingPage, savePageSettings, forTenant } from "@solar/db";
import { redirect } from "next/navigation";
import { getSiteEntitlements } from "../../../lib/entitlements.ts";
import { createLandingHandlers, createLandingSchema, saveLandingSettingsSchema } from "../../../lib/landingPages.ts";
import { getRuntime } from "../../../lib/runtime.ts";
import { getTenant } from "../../../lib/auth.ts";
import { createPageTypeHandler, pageTypeSchema } from "../../../lib/pageTypes.ts";

const handlers = createPageSectionHandlers(pageSectionDeps);
export const saveSectionsDraft = action("pages.structure", saveSectionsSchema, handlers.save);
export const publishSections = action("pages.publish", pageRevisionSchema, handlers.publish);
export const restorePageVersion = action("pages.publish", restoreVersionSchema, handlers.restore);
export const touchBuilderPresence = action("pages.view", presenceSchema, handlers.presence);
export const previewLink = action("pages.view", pageIdSchema, handlers.preview);
export const builderPreviewLink = action("pages.view", pageIdSchema, handlers.builderPreview);
export const saveSectionContent = action("content.edit", saveContentSchema, handlers.saveContent);
const setType = createPageTypeHandler({ tenant: getTenant, set: (tenantId, input) => setPageTypes(getRuntime().db, tenantId, input) });
export const setPageType = action("pages.structure", pageTypeSchema, async (input, context) => {
  const result = await setType(input, context);
  if (result.ok) revalidatePath("/trang");
  return result;
});

const landing = createLandingHandlers({ tenant: getTenant, entitlements: getSiteEntitlements,
  create: (tenantId, input) => createLandingPage(getRuntime().db, tenantId, input),
  save: (tenantId, input) => savePageSettings(getRuntime().db, tenantId, input),
  page: async pageId => forTenant(getRuntime().db, (await getTenant()).tenantId).page.get(pageId),
});
export const createLanding = action("pages.structure", createLandingSchema, async (input, context) => {
  const result = await landing.create(input, context);
  if (result.ok && result.url) { revalidatePath("/trang"); redirect(result.url); }
  return result;
});
export const saveLandingSettings = action("pages.structure", saveLandingSettingsSchema, async (input, context) => {
  const result = await landing.save(input, context);
  if (result.ok) { revalidatePath("/trang"); revalidatePath(`/trang/${input.pageId}`); }
  return result;
});
