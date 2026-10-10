import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import { SEGMENTS } from "@/config/segments";
import type { Post } from "@/data/posts";
import ProductImage from "@/components/ProductImage";

export default function PostCard({ post, headingLevel = 3, priority = false }: { post: Post; headingLevel?: 2 | 3; priority?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="t15-card t15-card-hover group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-tint">
        <ProductImage src={post.cover} alt="" fill {...(priority ? { priority: true } : { loading: "lazy" as const })} sizes="(max-width:768px) 100vw, 400px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
        {post.segment && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-black text-on-accent">{SEGMENTS[post.segment].short}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Heading className="text-lg font-black leading-snug text-fg">
          <Link href={`/tin-tuc/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">{post.title}</Link>
        </Heading>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs font-bold text-fg-muted">
          <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" />{post.readMinutes} phút đọc</span>
          <ArrowRightIcon className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
