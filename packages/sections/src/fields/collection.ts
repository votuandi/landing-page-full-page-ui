import { z } from "zod";
import { fieldRegistry } from "./widget";

export function collectionQuery(collection: string) {
  return z.object({
    filter: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    sort: z.object({ field: z.string().min(1), dir: z.enum(["asc", "desc"]) }).optional(),
    limit: z.number().int().min(1).max(48).default(6),
    ids: z.array(z.string().min(1)).max(48).optional(),
  }).register(fieldRegistry, { widget: "collectionQuery", collection });
}

export type CollectionQuery = z.output<ReturnType<typeof collectionQuery>>;
