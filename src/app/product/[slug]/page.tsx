import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/data/solar";
import { formatMoney, makeMetadata } from "@/utils/solar";
import ProductQuoteButton from "@/components/ProductQuoteButton";

export async function generateStaticParams() { return PRODUCTS.map((p) => ({ slug:p.slug })); }

export async function generateMetadata({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return {};
  return makeMetadata(
    `${product.brand} ${product.name} | Thiết bị solar`,
    `${product.name}: ${Object.entries(product.specs).slice(0,3).map(([k,v]) => `${k} ${v}`).join(", ")}. Bảo hành: ${product.warranty}.`,
    `/product/${product.slug}`,
    product.image
  );
}

export default async function ProductDetail({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();
  const compatible = PRODUCTS.filter((p) => product.compatible.includes(p.slug));
  const schema = {
    "@context":"https://schema.org","@type":"Product",name:`${product.brand} ${product.name}`,image:[product.image],
    brand:{"@type":"Brand",name:product.brand},description:Object.entries(product.specs).map(([k,v]) => `${k}: ${v}`).join(". "),
    ...(product.price ? { offers:{"@type":"Offer",priceCurrency:"VND",price:product.price,availability:"https://schema.org/InStock"} } : {})
  };
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
    <section className="t5-section"><div className="t5-container grid gap-10 lg:grid-cols-2">
      <div className="relative aspect-square bg-slate-100"><Image src={product.image} alt={`${product.brand} ${product.name}`} fill className="object-cover" priority /></div>
      <div><Link href="/product" className="text-sm font-bold text-slate-500">← Catalog thiết bị</Link><div className="mt-8 text-xs font-black uppercase tracking-[.18em] text-slate-400">{product.brand}</div><h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-[var(--t5-primary)] sm:text-5xl">{product.name}</h1><div className="mt-5 text-2xl font-black">{product.quoteOnly || !product.price ? "Liên hệ báo giá" : formatMoney(product.price)}</div><p className="mt-5 text-sm leading-7 text-slate-600">Bảo hành: {product.warranty}. Thông số trên website là dữ liệu mẫu phục vụ demo và cần đối chiếu datasheet của hãng khi báo giá thực tế.</p><div className="mt-8 flex flex-wrap gap-3"><ProductQuoteButton slug={product.slug} /><a href={product.datasheet} className="t5-button t5-button-secondary">Datasheet PDF</a></div></div>
    </div></section>
    <section className="t5-section bg-slate-50"><div className="t5-container grid gap-10 lg:grid-cols-[1fr_.7fr]"><div><span className="t5-eyebrow">Thông số kỹ thuật</span><div className="mt-6 border border-slate-200 bg-white">{Object.entries(product.specs).map(([k,v]) => <div key={k} className="grid grid-cols-2 border-b border-slate-200 p-4 last:border-0"><span className="text-slate-500">{k}</span><strong className="text-right">{v}</strong></div>)}</div></div><div><span className="t5-eyebrow">Bảo hành</span><div className="mt-6 border-l-4 border-[var(--t5-accent)] bg-white p-6"><div className="text-xl font-black text-[var(--t5-primary)]">{product.warranty}</div><p className="mt-3 text-sm leading-7 text-slate-600">Điều kiện đổi trả, suy giảm hiệu suất và phạm vi bảo hành cần đối chiếu chính sách nhà sản xuất/nhà phân phối tại thời điểm mua.</p></div></div></div></section>
    {compatible.length > 0 && <section className="t5-section"><div className="t5-container"><span className="t5-eyebrow">Combo tương thích</span><h2 className="t5-heading">Thiết bị thường được cân nhắc cùng sản phẩm này.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{compatible.map((item) => <Link key={item.slug} href={`/product/${item.slug}`} className="border border-slate-200 p-5"><div className="text-xs font-black text-slate-400">{item.brand}</div><div className="mt-2 font-black text-[var(--t5-primary)]">{item.name}</div><div className="mt-4 text-sm font-bold">Xem chi tiết →</div></Link>)}</div></div></section>}
  </main>;
}