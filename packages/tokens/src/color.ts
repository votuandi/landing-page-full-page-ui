import { RgbChannels } from "./schema";

/** CSS metadata needs a complete color rather than RGB channels. */
export function colorChannelsToHex(channels: string): string {
  return `#${RgbChannels.parse(channels).split(/\s+/).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}
