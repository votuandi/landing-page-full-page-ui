import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { mediaRef } from "../fields/media";
import { collectionQuery } from "../fields/collection";
import { collectRefs } from "../refs";
import { storySource } from "../collections/schemas";

test("file video sources are media refs in required/optional/nested content, embeds are not", () => {
  const id = "20c7d32c-e48f-40de-a9ea-3db1b71735c6";
  for (const schema of [storySource, storySource.optional(), z.object({ video: z.object({ source: storySource }).optional() })]) {
    const source = { provider: "file", idOrSrc: id };
    assert.deepEqual(collectRefs(schema, schema instanceof z.ZodObject && "video" in schema.shape ? { video: { source } } : source).media, [id]);
  }
  assert.deepEqual(collectRefs(storySource, { provider: "youtube", idOrSrc: "abcdefgh" }).media, []);
  assert.deepEqual(collectRefs(storySource, { provider: "bunny", idOrSrc: "https://cdn.example/video.mp4" }).media, []);
});

test("collects nested media and explicit collection IDs without treating arbitrary IDs as refs", () => {
  const schema = z.object({ images: z.array(mediaRef().optional()), query: collectionQuery("projects").default({ filter: {}, limit: 6 }), id: z.string() });
  assert.deepEqual(collectRefs(schema, { images: [{ id: "media-A" }, null, { id: 5 }], query: { ids: ["project-A", "project-B"] }, id: "unrelated" }), {
    media: ["media-A"], collections: { projects: ["project-A", "project-B"] },
  });
  assert.deepEqual(collectRefs(schema, null), { media: [], collections: {} });
});
test("walks nullable/default, records, unions, discriminated unions, pipes and lazy schemas", () => {
  const media = mediaRef();
  const schema = z.object({
    wrapped: media.nullable().default({ id: "default", alt: { vi: "" } }),
    record: z.record(z.string(), media),
    union: z.union([z.string(), z.object({ image: media })]),
    discriminated: z.discriminatedUnion("kind", [z.object({ kind: z.literal("image"), image: media }), z.object({ kind: z.literal("text"), text: z.string() })]),
    pipe: z.object({ image: media }).pipe(z.object({ image: media })),
    lazy: z.lazy(() => z.object({ query: collectionQuery("products") })),
  });
  assert.deepEqual(collectRefs(schema, {
    wrapped: { id: "A" }, record: { x: { id: "B" } }, union: { image: { id: "C" } },
    discriminated: { kind: "image", image: { id: "D" } }, pipe: { image: { id: "E" } }, lazy: { query: { ids: ["F"] } },
  }), { media: ["A", "B", "C", "D", "E"], collections: { products: ["F"] } });
  assert.deepEqual(collectRefs(schema, { wrapped: null, record: [], union: 1, discriminated: null, pipe: "invalid", lazy: {} }), { media: [], collections: {} });
});

test("keeps unknown collection names for the DB to reject, even without explicit IDs", () => {
  for (const name of ["unknown", "__proto__", "constructor"]) {
    assert.deepEqual(collectRefs(collectionQuery(name), {}), { media: [], collections: { [name]: [] } });
  }
});
