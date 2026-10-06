import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { POSTS } from "@/data/posts";
import PostCard from "@/components/PostCard";

/** 3–6 bài mới nhất (đầu mảng POSTS) theo tình huống sử dụng. */
export default function BlogSection({ limit = 3 }: { limit?: 3 | 4 | 5 | 6 }) {
  const posts = POSTS.slice(0, limit);
  if (!posts.length) return null;
  return (
    <section className="t5-section bg-bg-elevated" aria-labelledby="blog-title">
      <div className="t5-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div data-reveal="down">
            <span className="t5-eyebrow">Kinh nghiệm lắp đặt</span>
            <h2 id="blog-title" className="t5-heading">Đọc trước khi lắp: tình huống thực tế.</h2>
          </div>
          <Link href="/tin-tuc" className="t5-button t5-button-secondary">Tất cả bài viết <ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </div>
    </section>
  );
}
