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
    <section className="t5-page-hero !py-12 md:!py-16">
      <div className="t5-container">
        <span className="t5-eyebrow !border-on-media/20 !bg-on-media/10 !text-highlight">Tin tức</span>
        <h1 className="t5-page-title">Kinh nghiệm lắp điện mặt trời theo từng tình huống.</h1>
      </div>
    </section>
    <section className="t5-section">
      <div className="t5-container grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
    </section>
  </main>;
}
