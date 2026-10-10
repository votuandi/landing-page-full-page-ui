import { storySource, type StorySource } from "../collections/schemas";

export function storyEmbed(input: StorySource): { kind: "iframe" | "video"; src: string } {
  const source = storySource.parse(input);
  if (source.provider === "youtube") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${source.idOrSrc}?autoplay=1&mute=1&playsinline=1&rel=0` };
  if (source.provider === "tiktok") return { kind: "iframe", src: `https://www.tiktok.com/player/v1/${source.idOrSrc}?autoplay=1&muted=1` };
  return { kind: "video", src: source.idOrSrc };
}
