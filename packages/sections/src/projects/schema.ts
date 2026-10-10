import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery } from "../fields";
import { segmentLabelsSchema } from "../shared/contentSchema";
import { projectItem } from "../collections/schemas";
import { fieldRegistry } from "../fields/widget";
import { projectsFixture } from "./fixtures";

export const projectsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  query: collectionQuery("projects").extend({ limit: z.number().int().min(1).max(48).default(8) }).register(fieldRegistry, { widget: "collectionQuery", collection: "projects" }),
  items: z.array(projectItem).max(48).default([]), showFilter: z.boolean().default(true), segmentLabels: segmentLabelsSchema,
  savingLabel: localized({ max: 60 }), allLabel: localized({ max: 60 }), ctaLabel: localized({ max: 100 }),
});

export const projects = defineSectionType({
  type: "projects", schemaVersion: 1, schema: projectsSchema,
  defaults: projectsSchema.parse(projectsFixture),
  meta: {"label": {"vi": "Công trình đã thực hiện", "en": "Completed projects"}, "icon": "projects", "collections": ["projects"]},
});
