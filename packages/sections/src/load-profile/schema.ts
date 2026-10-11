import { z } from "zod";
import { defineSectionType } from "../define";
import { localized } from "../fields";
import { energyMonitoringSchema } from "../energy-monitoring/schema";
import { loadProfileFixture } from "./fixtures";

export const loadProfileSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 1000 }),
  chart: energyMonitoringSchema.shape.chart,
  unit: localized({ max: 60 }),
  metrics: z.array(z.object({ label: localized({ max: 100 }), value: z.string().min(1).max(100) })).max(6),
});

export const loadProfile = defineSectionType({
  type: "load-profile", schemaVersion: 1, schema: loadProfileSchema,
  defaults: loadProfileSchema.parse(loadProfileFixture),
  meta: { label: { vi: "Biểu đồ phụ tải", en: "Load profile" }, icon: "chart", entitlement: "energyMonitoring" },
});
