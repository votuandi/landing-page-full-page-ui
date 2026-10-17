import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateProjectsV1 } from "./migrations";
import { localized, collectionQuery } from "../fields";
import { segmentLabelsSchema } from "../shared/contentSchema";
import { projectItem } from "../collections/schemas";
import { fieldRegistry } from "../fields/widget";
import { projectsFixture } from "./fixtures";
import { packageSimulationSchema } from "../shared/packageSimulation";
import { uniqueBy } from "../shared/schema";

export const projectsSchema = z.object({
  evidence: z.object({
    simulation: packageSimulationSchema,
    carbonKgPerKwh: z.number().nonnegative().max(10),
    cases: z.array(z.object({ projectId: z.string().min(1), packageId: z.string().min(1), provinceId: z.string().min(1), description: localized({ max: 600 }) }))
      .max(48).refine(uniqueBy("projectId"), "Dự án minh chứng bị trùng"),
  }).refine((v) => v.cases.every((c) => v.simulation.packages.some((p) => p.id === c.packageId) && v.simulation.provinces.some((p) => p.id === c.provinceId)), "Gói hoặc tỉnh/thành chưa có trong mô phỏng").optional(),
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  query: collectionQuery("projects").extend({ limit: z.number().int().min(1).max(48).default(8) }).register(fieldRegistry, { widget: "collectionQuery", collection: "projects" }),
  items: z.array(projectItem).max(48).default([]), showFilter: z.boolean().default(true), segmentLabels: segmentLabelsSchema,
  savingLabel: localized({ max: 60 }), allLabel: localized({ max: 60 }), ctaLabel: localized({ max: 100 }),
});

export const projects = defineSectionType({
  migrations: { 1: migrateProjectsV1 },
  type: "projects", schemaVersion: 2, schema: projectsSchema,
  defaults: projectsSchema.parse(projectsFixture),
  meta: {"label": {"vi": "Công trình đã thực hiện", "en": "Completed projects"}, "icon": "projects", "collections": ["projects"]},
});
