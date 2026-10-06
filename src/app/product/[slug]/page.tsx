import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG_COPY as C, COPY, PRODUCTS } from "@/content/site";
import { moneyVi } from "@/utils/estimate";
import { makeMetadata } from "@/utils/solar";
import ProductQuoteButton from "@/components/ProductQuoteButton";
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = PRODUCTS.find((p) => p.slug === slug);
  return p
    ? makeMetadata(p.name, C.description, `/product/${slug}`, p.image)
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = PRODUCTS.find((p) => p.slug === slug);
  if (!p) notFound();
  const compatible = PRODUCTS.filter((i) => p.compatible.includes(i.slug));
  return (
    <main>
      <section className="t5-section">
        <div className="t5-container grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-[28px]">
            <Image
              src={p.image}
              alt={`${COPY.imageNote}: ${p.name}`}
              priority
              fill
              sizes="(min-width:1024px) 580px, 95vw"
              className="object-cover"
            />
          </div>
          <div>
            <Link href="/product" className="t5-button t5-button-secondary">
              ← {C.back}
            </Link>
            <p className="mt-8 text-sm text-slate-600">{p.brand}</p>
            <h1 className="t5-heading">{p.name}</h1>
            <p className="mt-6 text-2xl font-black text-blue-900">
              {p.price ? moneyVi(p.price) : C.quote}
            </p>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {C.description}
            </p>
            <div className="mt-6">
              <ProductQuoteButton slug={p.slug} />
            </div>
            {p.datasheet ? (
              <a
                href={p.datasheet}
                className="t5-button t5-button-secondary mt-4"
              >
                {C.datasheet}
              </a>
            ) : (
              <p className="mt-4 text-xs text-slate-600">
                {C.datasheetPending}
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="t5-section bg-blue-50">
        <div className="t5-container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">{C.specs}</h2>
            <dl className="t8-card mt-6 divide-y divide-slate-200 overflow-hidden">
              {Object.entries(p.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-3 p-5">
                  <dt className="text-sm text-slate-600">{k}</dt>
                  <dd className="text-right text-sm font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-black">{C.warranty}</h2>
            <p className="mt-6 text-xl font-bold text-blue-900">{p.warranty}</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {C.warrantyNote}
            </p>
            <p className="mt-4 text-xs text-slate-600">{COPY.demo}</p>
          </div>
        </div>
      </section>
      {compatible.length > 0 && (
        <section className="t5-section">
          <div className="t5-container">
            <h2 className="text-3xl font-black">{C.compatible}</h2>
            <p className="mt-4 text-sm text-slate-600">{C.compatibilityNote}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {compatible.map((i) => (
                <Link
                  href={`/product/${i.slug}`}
                  key={i.slug}
                  className="t8-card p-6 font-bold text-blue-900"
                >
                  {i.name} ↗
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
