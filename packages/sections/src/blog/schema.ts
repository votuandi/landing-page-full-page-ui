import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery, link } from "../fields";
import { postItem } from "../collections/schemas";
import { segmentLabelsSchema } from "../shared/contentSchema";
import { fieldRegistry } from "../fields/widget";
import { blogFixture } from "./fixtures";

export const blogSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  query: collectionQuery("posts").extend({ limit: z.number().int().min(3).max(6).default(3) }).register(fieldRegistry, { widget: "collectionQuery", collection: "posts" }), items: z.array(postItem).max(6).default([]), allLink: link().optional(), readMinutesLabel: localized({ max: 40 }), segmentLabels: segmentLabelsSchema,
});

export const blog = defineSectionType({
  type: "blog", schemaVersion: 1, schema: blogSchema,
  defaults: blogSchema.parse(blogFixture),
  meta: {"label": {"vi": "Kinh nghiệm lắp đặt", "en": "Installation know-how"}, "icon": "blog", "collections": ["posts"]},
});
