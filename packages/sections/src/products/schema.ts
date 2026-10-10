import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery, link } from "../fields";
import { productItem } from "../collections/schemas";
import { fieldRegistry } from "../fields/widget";
import { productsFixture } from "./fixtures";

export const productsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  query: collectionQuery("products").extend({ filter: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({ featured: true }), limit: z.number().int().min(1).max(12).default(8) }).register(fieldRegistry, { widget: "collectionQuery", collection: "products" }),
  items: z.array(productItem).max(12).default([]), allLink: link().optional(),
  quickViewLabel: localized(), addLabel: localized(), addedLabel: localized(), compactAddLabel: localized(), viewCartLabel: localized(), detailsLabel: localized(), warrantyLabel: localized(), contactPriceLabel: localized(),
});

export const products = defineSectionType({
  type: "products", schemaVersion: 1, schema: productsSchema,
  defaults: productsSchema.parse(productsFixture),
  meta: {"label":{"vi":"Cửa hàng thiết bị"},"icon":"products","entitlement":"catalog","collections":["products"]},
});
