import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONFIG, catalogEnabled } from "@/config/site";
import { CATEGORY_LABEL, PRODUCTS, productBySlug } from "@/data/products";
import { resolvePrice } from "@/lib/price";
import { makeMetadata } from "@/utils/solar";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import PriceTag from "@/components/PriceTag";
import ProductImage from "@/components/ProductImage";

export async function generateStaticParams() { return catalogEnabled ? PRODUCTS.map((p) => ({ slug: p.slug })) : []; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  return makeMetadata(
    `${product.name} | ${product.brand}`,
    `${product.name} (${product.brand}): ${Object.entries(product.specs).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(", ")}. Bảo hành ${product.warranty}.`,
    `/san-pham/${product.slug}`,
  );
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!catalogEnabled || !product) notFound();
  const { current } = resolvePrice(product.price, product.salePrice);
  const compatible = PRODUCTS.filter((p) => product.compatible?.includes(p.slug));
  const related = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug && !compatible.includes(p)).slice(0, 4);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((src) => new URL(src, SITE_CONFIG.url).toString()),
    description: Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join(". "),
    ...(current ? { offers: { "@type": "Offer", priceCurrency: "VND", price: current, availability: "https://schema.org/InStock" } } : {}),
  };
  const card = (p: (typeof PRODUCTS)[number]) => (
    <Link key={p.slug} href={`/san-pham/${p.slug}`} className="t15-card t15-card-hover overflow-hidden">
      <div className="relative aspect-square bg-bg-tint"><ProductImage src={p.images[0]} alt="" fill sizes="(max-width:1024px) 50vw, 280px" className="object-cover" /></div>
      <div className="p-4"><div className="text-[11px] font-black uppercase tracking-[.14em] text-secondary">{p.brand}</div><div className="mt-1 line-clamp-2 font-black text-fg">{p.name}</div><div className="mt-2"><PriceTag price={p.price} salePrice={p.salePrice} className="text-base" /></div></div>
    </Link>
  );

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <section className="t15-section bg-gradient-to-b from-bg-tint to-bg">
      <div className="t15-container grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[32px] border-4 border-bg-elevated bg-bg-tint shadow-xl"><ProductImage src={product.images[0]} alt={product.name} fill priority sizes="(max-width:1024px) 100vw, 600px" className="object-cover" /></div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1).map((src) => <div key={src} className="relative aspect-square overflow-hidden rounded-2xl bg-bg-tint"><ProductImage src={src} alt="" fill sizes="150px" className="object-cover" /></div>)}
            </div>
          )}
        </div>
        <div>
          <Link href="/san-pham" className="text-sm font-bold text-fg-muted hover:text-primary">← Tất cả sản phẩm</Link>
          <div className="mt-6 text-xs font-black uppercase tracking-[.18em] text-secondary">{product.brand} · {CATEGORY_LABEL[product.category]}</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-fg sm:text-5xl">{product.name}</h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-2"><PriceTag price={product.price} salePrice={product.salePrice} className="text-3xl" />{product.unit && current ? <span className="text-sm text-fg-muted">/ {product.unit}</span> : null}</div>
          <dl className="t15-card mt-6 divide-y divide-line/10 text-sm">
            {Object.entries(product.specs).map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-fg-muted">{k}</dt><dd className="text-right font-bold text-fg">{v}</dd></div>)}
            <div className="flex justify-between gap-4 px-5 py-3"><dt className="text-fg-muted">Bảo hành</dt><dd className="text-right font-bold text-fg">{product.warranty}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <AddToQuoteButton sku={product.slug} name={product.name} openCart />
            {product.datasheet && <a href={product.datasheet} className="t15-button t15-button-secondary">Datasheet PDF</a>}
            <Link href="/#du-toan" className="t15-button t15-button-secondary">Cần lắp trọn gói? Dự toán chi phí</Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-fg-subtle">Thông số là dữ liệu mẫu của website demo — đối chiếu datasheet của hãng khi báo giá thực tế. Điều kiện bảo hành theo chính sách nhà sản xuất/nhà phân phối tại thời điểm mua.</p>
        </div>
      </div>
    </section>
    {compatible.length > 0 && (
      <section className="t15-section bg-bg-elevated">
        <div className="t15-container">
          <span className="t15-eyebrow">Combo tương thích</span>
          <h2 className="t15-heading">Thiết bị thường được chọn cùng sản phẩm này.</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{compatible.map(card)}</div>
        </div>
      </section>
    )}
    {related.length > 0 && (
      <section className="t15-section bg-bg-tint">
        <div className="t15-container">
          <h2 className="text-2xl font-black text-fg">Cùng danh mục</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map(card)}</div>
        </div>
      </section>
    )}
  </main>;
}
