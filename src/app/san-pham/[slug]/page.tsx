import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_CONFIG, catalogEnabled } from "@/config/site";
import { CATEGORY_LABEL, PRODUCTS, productBySku } from "@/data/products";
import { resolvePrice } from "@/lib/price";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import PriceTag from "@/components/PriceTag";
import ProductImage from "@/components/ProductImage";
import { makeMetadata } from "@/utils/solar";

export async function generateStaticParams() { return catalogEnabled ? PRODUCTS.map((p) => ({ slug: p.sku })) : []; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySku(slug);
  if (!product) return {};
  return makeMetadata(product.name, `${product.name} (${product.brand}): ${Object.entries(product.specs).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(", ")}. Bảo hành ${product.warranty}.`, `/san-pham/${product.sku}`);
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySku(slug);
  if (!catalogEnabled || !product) notFound();
  const { current } = resolvePrice(product.price, product.salePrice);
  const related = PRODUCTS.filter((p) => p.category === product.category && p.sku !== product.sku).slice(0, 4);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((src) => new URL(src, SITE_CONFIG.url).toString()),
    description: Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join(". "),
    ...(current ? { offers: { "@type": "Offer", priceCurrency: "VND", price: current, availability: "https://schema.org/InStock" } } : {}),
  };
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <section className="t5-section">
      <div className="t5-container grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[32px] bg-bg-tint"><ProductImage src={product.images[0]} alt={product.name} fill priority sizes="(max-width:1024px) 100vw, 600px" className="object-cover" /></div>
        <div>
          <Link href="/san-pham" className="text-sm font-bold text-fg-muted hover:text-primary">← Tất cả sản phẩm</Link>
          <div className="mt-6 text-xs font-black uppercase tracking-[.18em] text-fg-subtle">{product.brand} · {CATEGORY_LABEL[product.category]}</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-fg sm:text-5xl">{product.name}</h1>
          <div className="mt-5"><PriceTag price={product.price} salePrice={product.salePrice} className="text-3xl" /></div>
          <dl className="t8-card mt-6 divide-y divide-line/12 text-sm">
            {Object.entries(product.specs).map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-fg-muted">{k}</dt><dd className="text-right font-bold text-fg">{v}</dd></div>)}
            <div className="flex justify-between gap-4 px-5 py-3"><dt className="text-fg-muted">Bảo hành</dt><dd className="text-right font-bold text-fg">{product.warranty}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3"><AddToQuoteButton sku={product.sku} name={product.name} /><Link href="/#du-toan" className="t5-button t5-button-secondary">Cần lắp trọn gói? Dự toán chi phí</Link></div>
          <p className="mt-4 text-xs leading-5 text-fg-subtle">Thông số là dữ liệu mẫu của website demo — đối chiếu datasheet của hãng khi báo giá thực tế.</p>
        </div>
      </div>
    </section>
    {related.length > 0 && (
      <section className="t5-section bg-bg-tint">
        <div className="t5-container">
          <h2 className="text-2xl font-black text-fg">Cùng danh mục</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => <Link key={p.sku} href={`/san-pham/${p.sku}`} className="t8-card overflow-hidden transition hover:-translate-y-1"><div className="relative aspect-square bg-bg-tint"><ProductImage src={p.images[0]} alt="" fill sizes="(max-width:1024px) 50vw, 280px" className="object-cover" /></div><div className="p-4"><div className="line-clamp-2 font-black text-fg">{p.name}</div><div className="mt-2"><PriceTag price={p.price} salePrice={p.salePrice} className="text-base" /></div></div></Link>)}
          </div>
        </div>
      </section>
    )}
  </main>;
}
