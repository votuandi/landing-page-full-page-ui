import type { CollectionSource } from "@solar/sections";
import { PROJECTS } from "../data/projects";
import { STORIES } from "../data/stories";
import { TESTIMONIALS } from "../data/testimonials";
import { POSTS } from "../data/posts";

const media = (id: string, alt: string) => ({ id, alt: { vi: alt } });
const sample = (value: string) => `[DỮ LIỆU MẪU] ${value}`;

/** E3 temporary adapter: bundled Vietnamese demo data. E5 replaces this with tenant repositories. */
export const staticCollectionSource: CollectionSource = {
  projects: () => PROJECTS.map((project) => ({
    id: project.slug, title: sample(project.title), segment: project.segment, location: project.location,
    kwp: project.kwp, savingPerMonth: project.savingPerMonth, image: media(project.image, project.title),
    href: `/cong-trinh/${project.slug}`, video: STORIES.find((story) => story.id === project.storyId)?.source,
  })),
  stories: () => STORIES.map((story) => ({
    id: story.id, title: sample(story.shortTitle), location: story.location, kwp: story.kwp, segment: story.segment,
    kind: story.type, poster: media(story.poster, story.shortTitle), source: story.source,
  })),
  testimonials: () => TESTIMONIALS.map((item, i) => ({ ...item, id: `testimonial-${i + 1}`, name: sample(item.name) })),
  posts: () => POSTS.map((post) => ({
    id: post.slug, title: sample(post.title), excerpt: post.excerpt, segment: post.segment,
    cover: media(post.cover, post.title), readMinutes: post.readMinutes, href: `/tin-tuc/${post.slug}`,
  })),
};
