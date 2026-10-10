import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery } from "../fields";
import { branchItem } from "../collections/schemas";
import { fieldRegistry } from "../fields/widget";
import { branchMapFixture } from "./fixtures";

export const branchMapSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  query: collectionQuery("branches").extend({ limit: z.number().int().min(1).max(48).default(12) }).register(fieldRegistry, { widget: "collectionQuery", collection: "branches" }),
  items: z.array(branchItem).max(48).default([]),
  officeLabel: localized(), warehouseLabel: localized(), hotlineLabel: localized(), directionsLabel: localized(), zaloLabel: localized(),
});

export const branchMap = defineSectionType({
  type: "branch-map", schemaVersion: 1, schema: branchMapSchema,
  defaults: branchMapSchema.parse(branchMapFixture),
  meta: {"label":{"vi":"Hệ thống chi nhánh"},"icon":"branch-map","entitlement":"branchMap","collections":["branches"]},
});
