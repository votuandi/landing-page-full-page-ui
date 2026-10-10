import { z } from "zod";
import { mediaRef } from "../fields";
import { segmentEnum } from "../shared/schema";

const https = () => z.url().refine((url) => new URL(url).protocol === "https:", "HTTPS required");
const localPath = (path: string) => {
  try {
    const decoded = decodeURIComponent(path);
    return decoded.startsWith("/") && !decoded.includes("//") && !decoded.includes("..") && !/[\\\u0000-\u0020?#]/.test(decoded);
  } catch { return false; }
};
export const storySource = z.object({
  provider: z.enum(["youtube", "tiktok", "file", "bunny"]),
  idOrSrc: z.string().min(1).max(2000),
  originalUrl: https().optional(),
}).refine(({ provider, idOrSrc }) => {
  if (provider === "youtube") return /^[\w-]{6,20}$/.test(idOrSrc);
  if (provider === "tiktok") return /^\d{6,25}$/.test(idOrSrc);
  if (provider === "file") return localPath(idOrSrc);
  return https().safeParse(idOrSrc).success;
}, { message: "Invalid video source", path: ["idOrSrc"] });

const text = () => z.string().trim().min(1).max(1500);
const href = () => z.string().refine((value) => localPath(value) || https().safeParse(value).success, "Invalid content link");
export const projectItem = z.object({
  id: text(), title: text(), segment: segmentEnum(), location: text(), kwp: z.number().positive(),
  savingPerMonth: z.number().nonnegative().optional(), image: mediaRef(), href: href().optional(), video: storySource.optional(),
});
export const storyItem = z.object({
  id: text(), title: text(), location: text(), kwp: z.number().positive(), segment: segmentEnum(),
  kind: z.enum(["progress", "done", "customer"]), poster: mediaRef(), source: storySource,
});
export const testimonialItem = z.object({
  id: text(), name: text(), segment: segmentEnum(), location: text(), kwp: z.number().positive(),
  quote: text(), rating: z.number().min(0).max(5),
});
export const postItem = z.object({
  id: text(), title: text(), excerpt: text(), segment: segmentEnum().optional(), cover: mediaRef(),
  readMinutes: z.number().int().positive(), href: href(),
});
export type StorySource = z.output<typeof storySource>;
export type ProjectItem = z.output<typeof projectItem>;
export type StoryItem = z.output<typeof storyItem>;
export type TestimonialItem = z.output<typeof testimonialItem>;
export type PostItem = z.output<typeof postItem>;
export const collectionSchemas = { projects: projectItem, stories: storyItem, testimonials: testimonialItem, posts: postItem };
export type CollectionName = keyof typeof collectionSchemas;
