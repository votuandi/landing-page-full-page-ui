import { RgbChannels } from "./schema";

export function hexToChannels(hex: string): string {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error("Mã màu phải có dạng #RRGGBB");
  return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)).join(" ");
}

/** CSS metadata needs a complete color rather than RGB channels. */
export function colorChannelsToHex(channels: string): string {
  return `#${RgbChannels.parse(channels).split(/\s+/).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}
