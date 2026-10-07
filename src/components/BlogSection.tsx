import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { POSTS } from "@/data/posts";
import { Tr } from "@/i18n/LangProvider";
import PostCard from "@/components/PostCard";

/** 3–6 bài mới nhất (đầu mảng POSTS) theo tình huống sử dụng. */
export default function BlogSection({ limit = 3 }: { limit?: 3 | 4 | 5 | 6 }) {
  const posts = POSTS.slice(0, limit);
  if (!posts.length) return null;
  return (
    <section id="kinh-nghiem" className="t15-section bg-bg-elevated" aria-labelledby="blog-title">
      <div className="t15-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div data-reveal="down">
            <span className="t15-eyebrow"><Tr vi="Kinh nghiệm lắp đặt" en="Installation know-how" /></span>
            <h2 id="blog-title" className="t15-heading"><Tr vi="Đọc trước khi lắp: tình huống thực tế." en="Read before you install: real cases." /></h2>
          </div>
          <Link data-reveal="up" href="/tin-tuc" className="t15-button t15-button-secondary"><Tr vi="Tất cả bài viết" en="All articles" /> <ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </div>
    </section>
  );
}
