import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized, link, collectionQuery } from "../../fields";
import { productItem } from "../../collections/schemas";
import { fieldRegistry } from "../../fields/widget";
import { fixture } from "./fixtures";

export const quoteCartSchema = z.object({
  query: collectionQuery("products").extend({ limit: z.number().int().min(1).max(48).default(48) }).register(fieldRegistry, { widget: "collectionQuery", collection: "products" }),
  items: z.array(productItem).default([]), browseLink: link(),
  title: localized(), note: localized(), emptyText: localized(), browseLabel: localized(), formTitle: localized(), formDescription: localized(), messagePlaceholder: localized(), submitLabel: localized(), successTitle: localized(), successMessage: localized(), continueLabel: localized(), buttonLabel: localized(),
});
export const quoteCart = defineSectionType({
  type: "quote-cart", schemaVersion: 1, schema: quoteCartSchema, defaults: quoteCartSchema.parse(fixture),
  meta: {"label": {"vi": "quote-cart"}, "icon": "quote-cart", "entitlement": "catalog", "collections": ["products"]},
});
