import type { Segment } from "@solar/core";
import type { StorySource } from "../collections/schemas";

/** Only resolved strings and validated video sources cross into the player island. */
export type StoryView = {
  id: string; title: string; location: string; kwp: number; segment: Segment;
  poster?: string; source: StorySource; kindLabel: string;
};
