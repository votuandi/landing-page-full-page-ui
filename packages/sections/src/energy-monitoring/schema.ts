import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { energyMonitoringFixture } from "./fixtures";

export const energyMonitoringSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 1000 }), image: mediaRef().optional(),
  flows: z.array(z.object({ label: localized(), value: z.number().finite().nonnegative(), unit: localized({ max: 30 }) })).min(1).max(6),
  features: z.array(z.object({ title: localized(), description: localized({ multiline: true, max: 600 }).optional() })).max(8),
  chart: z.object({ production: z.array(z.number().finite().nonnegative()).length(24), consumption: z.array(z.number().finite().nonnegative()).length(24), productionLabel: localized(), consumptionLabel: localized() }),
});

export const energyMonitoring = defineSectionType({
  type: "energy-monitoring", schemaVersion: 1, schema: energyMonitoringSchema,
  defaults: energyMonitoringSchema.parse(energyMonitoringFixture),
  meta: {"label": {"vi": "Theo dõi điện năng 24/7", "en": "Energy monitoring 24/7"}, "icon": "energy-monitoring", "entitlement": "energyMonitoring"},
});
