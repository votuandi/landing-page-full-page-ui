"use server";

import { action } from "../../../lib/action.ts";
import { createPageSectionHandlers, pageIdSchema, pageRevisionSchema, saveSectionsSchema } from "../../../lib/pageSections.ts";
import { pageSectionDeps } from "../../../lib/pageSectionRuntime.ts";

const handlers = createPageSectionHandlers(pageSectionDeps);
export const saveSectionsDraft = action("pages.structure", saveSectionsSchema, handlers.save);
export const publishSections = action("pages.publish", pageRevisionSchema, handlers.publish);
export const previewLink = action("pages.view", pageIdSchema, handlers.preview);
