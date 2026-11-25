import assert from "node:assert/strict";
import { test } from "node:test";
import { storySource, type StorySource } from "../collections/schemas";
import { FRAME_SOURCES, storyEmbed } from "../shared/storyEmbed";

test("embeds stay inside FRAME_SOURCES", () => {
  const examples: Record<StorySource["provider"], string> = {
    youtube: "abcdefghijk", tiktok: "1234567890123", file: "/videos/demo.mp4", bunny: "https://demo.b-cdn.net/demo.mp4",
  };
  for (const provider of storySource.shape.provider.options) {
    const embed = storyEmbed({ provider, idOrSrc: examples[provider] });
    if (embed.kind === "iframe") assert.ok(FRAME_SOURCES.includes(new URL(embed.src).origin), provider);
    else assert.ok(embed.src.startsWith("/") || embed.src.startsWith("https:"), provider);
  }
});
