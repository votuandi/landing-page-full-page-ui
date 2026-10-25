export type MediaFocal = { x: number; y: number };
type Widths = readonly [number, number, number];
const slots = [640, 1280, 1920] as const;

/** Fragment metadata stays in SSR props and is never sent to storage/CDN. */
export function encodeMediaUrl(base: string, widths: Widths, focal?: MediaFocal): string {
  return `${base}#m=${widths.join(",")}${focal ? `&f=${focal.x},${focal.y}` : ""}`;
}

export function parseMediaUrl(src: string) {
  const match = /^([^#]*-w1920\.webp)#m=([1-9]\d*),([1-9]\d*),([1-9]\d*)(?:&f=([\d.eE+-]+),([\d.eE+-]+))?$/.exec(src);
  if (!match) return null;
  const widths: Widths = [Number(match[2]), Number(match[3]), Number(match[4])];
  if (widths.some((width, i) => width > slots[i] || (i > 0 && width < widths[i - 1]))) return null;
  const focal = match[5] === undefined ? undefined : { x: Number(match[5]), y: Number(match[6]) };
  if (focal && [focal.x, focal.y].some(value => !Number.isFinite(value) || value < 0 || value > 1)) return null;
  return {
    widths, focal,
    url(width: number, format: "avif" | "webp") {
      const target = Math.min(width, widths[2]);
      const index = widths.findIndex(actual => actual >= target);
      return match[1].replace(/-w1920\.webp$/, `-w${slots[index < 0 ? 2 : index]}.${format}`);
    },
  };
}
