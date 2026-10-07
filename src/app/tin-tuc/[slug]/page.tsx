import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS } from "@/config/segments";
import { POSTS, postBySlug } from "@/data/posts";
import PostCard from "@/components/PostCard";
import ProductImage from "@/components/ProductImage";
import { makeMetadata } from "@/utils/solar";

export async function generateStaticParams() { return POSTS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  return post ? makeMetadata(post.title, post.excerpt, `/tin-tuc/${post.slug}`, post.cover.endsWith(".svg") ? undefined : post.cover) : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const cta = post.segment ? `/?phan-khuc=${SEGMENTS[post.segment].slug}#du-toan` : "/#du-toan";
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, publisher: { "@type": "Organization", name: SITE_CONFIG.brand.name } };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <article className="t5-section">
      <div className="t5-container max-w-3xl">
        <Link href="/tin-tuc" className="text-sm font-bold text-fg-muted hover:text-primary">← Tất cả bài viết</Link>
        <div className="mt-6 text-xs font-black uppercase tracking-[.16em] text-primary-strong">{post.segment ? SEGMENTS[post.segment].label : "Kinh nghiệm"} · {post.readMinutes} phút đọc</div>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-.04em] text-fg sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-8 text-fg-muted">{post.excerpt}</p>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[28px] bg-bg-tint"><ProductImage src={post.cover} alt="" fill priority sizes="(max-width:768px) 100vw, 768px" className="object-cover" /></div>
        <div className="mt-10 space-y-5 text-base leading-8 text-fg">
          {post.body.map((block, i) => block.startsWith("## ")
            ? <h2 key={i} className="pt-4 text-2xl font-black tracking-[-.02em] text-fg">{block.slice(3)}</h2>
            : <p key={i}>{block}</p>)}
        </div>
        <div className="t13-invert mt-12 rounded-[28px] border border-line/10 bg-bg-tint p-6 sm:p-8">
          <h2 className="text-2xl font-black">Tính thử cho công trình của bạn</h2>
          <p className="mt-2 text-fg-muted">Nhập tiền điện và diện tích mái để biết công suất, chi phí và thời gian hoàn vốn.</p>
          <Link href={cta} className="t5-button t5-button-primary mt-5">Dự toán chi phí</Link>
        </div>
      </div>
    </article>
    {others.length > 0 && (
      <section className="t5-section bg-bg-tint">
        <div className="t5-container">
          <h2 className="text-2xl font-black text-fg">Bài viết khác</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">{others.map((p) => <PostCard key={p.slug} post={p} />)}</div>
        </div>
      </section>
    )}
  </main>;
}
