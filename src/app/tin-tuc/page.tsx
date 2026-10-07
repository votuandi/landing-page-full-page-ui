import { POSTS } from "@/data/posts";
import PostCard from "@/components/PostCard";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Kinh nghiệm lắp điện mặt trời",
  "Bài viết theo tình huống: hộ gia đình, cửa hàng, nhà máy, trại gà — nên lắp bao nhiêu kWp, hoàn vốn bao lâu, chọn thiết bị thế nào.",
  "/tin-tuc",
);

export default function BlogPage() {
  return <main>
    <section className="t15-page-hero !py-12 md:!py-16">
      <div className="t15-container">
        <span className="t15-eyebrow">Tin tức</span>
        <h1 className="t15-page-title">Kinh nghiệm lắp điện mặt trời theo từng tình huống.</h1>
      </div>
    </section>
    <section className="t15-section">
      <div className="t15-container grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p, i) => <PostCard key={p.slug} post={p} headingLevel={2} priority={i === 0} />)}
      </div>
    </section>
  </main>;
}
