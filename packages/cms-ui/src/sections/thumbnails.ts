import { sectionThumbnails } from "./thumbnails.generated.ts";

export function thumbnailSrc(themeId: string, type: string, variant: string): string | undefined {
  const key = `${type}--${variant}`;
  return Object.hasOwn(sectionThumbnails, themeId) && sectionThumbnails[themeId].includes(key)
    ? `/section-thumbs/${themeId}/${key}.webp` : undefined;
}
