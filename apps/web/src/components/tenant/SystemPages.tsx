import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageRenderer, RichText, createCollectionLoader, type PageConfig } from "@solar/sections";
import { MediaImage, PriceTag } from "@solar/ui";
import ProductCatalog from "@/components/ProductCatalog";
import ProductImage from "@/components/ProductImage";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import { tenantCollections } from "@/lib/tenant/collections";
import { planCanUse, type TenantSite } from "@/lib/tenant/siteData";
import { text } from "@/lib/tenant/contentSchemas";
import type { Route } from "@/lib/tenant/routes";

function Links({ items, prefix }: { items: { id: string; slug: string; title: string; excerpt?: string }[]; prefix: string }) {
  return <div className="grid gap-5 md:grid-cols-3">{items.map((item) => <article key={item.id} className="t15-card p-6">
    <h2 className="text-xl font-heading"><Link href={`/${prefix}/${item.slug}`} className="hover:text-primary">{item.title}</Link></h2>
    {item.excerpt && <p className="mt-3 text-fg-muted">{item.excerpt}</p>}
  </article>)}</div>;
}
export function SystemFrame({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <main><section className="t15-page-hero"><div className="t15-container"><h1 className="t15-page-title">{title}</h1>{description && <p className="t15-page-desc">{description}</p>}</div></section>
    <section className="t15-section"><div className="t15-container space-y-8">{children}</div></section></main>;
}
function Picture({ src, alt }: { src: string; alt: string }) {
  if (!src.startsWith("/") && !src.startsWith("https://")) return <div className="relative h-96 rounded-media"><MediaImage alt={alt} sizes="100vw" /></div>;
  return <img src={src} alt={alt} className="max-h-96 w-full rounded-media object-cover" />;
}
export async function loadSystemPage(site: TenantSite, route: Exclude<Route, { kind: "page" }>) {
  const collections = tenantCollections(site.tenantId, site.locale);
  if (route.kind === "policy") {
    const policy = site.profile.legal.policies.find((item) => item.slug === route.slug);
    if (!policy) return null;
    return { title: text(policy.title, site.locale), description: text(policy.summary, site.locale), content: <>
      <article className="t15-card space-y-5 p-6 leading-8"><RichText value={policy.body} locale={site.locale} /></article>
      <nav aria-label="Các chính sách khác" className="flex flex-wrap gap-3">{site.profile.legal.policies.map((item) => <Link className="t15-chip" key={item.slug} href={`/chinh-sach/${item.slug}`}>{text(item.title, site.locale)}</Link>)}</nav>
    </> };
  }
  if (route.collection === "product") {
    const items = await collections.products();
    if (route.kind === "list") return { title: "Sản phẩm", description: text(site.profile.description, site.locale), content: <ProductCatalog products={items} categories={[...new Map(items.map((item) => [item.category, { value: item.category, label: item.categoryLabel }])).values()]} /> };
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    const related = items.filter((other) => other.id !== item.id && other.category === item.category);
    const compatible = items.filter((other) => item.compatible?.includes(other.slug));
    const cartEnabled = site.widgets["quote-cart"]?.enabled && planCanUse(site.planId)("quoteCart");
    return { title: item.name, description: `${item.brand} · ${item.warranty}`, content: <>
      <div className="grid gap-8 md:grid-cols-2"><div className="grid gap-4">{item.images.map((src) => <div key={src} className="relative aspect-square overflow-hidden rounded-media bg-bg-tint"><ProductImage src={src} alt={item.name} fill sizes="(max-width:768px) 100vw, 50vw" className="object-contain" /></div>)}</div>
        <div className="t15-card p-6"><p>{item.brand} · {item.categoryLabel}</p><PriceTag price={item.price} salePrice={item.salePrice} className="my-4 text-2xl" />
          <dl>{Object.entries(item.specs).map(([key, value]) => <div className="flex justify-between gap-4 border-b border-line/10 py-3" key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
          <p className="my-5">Bảo hành: {item.warranty}</p>{cartEnabled && <AddToQuoteButton sku={item.slug} name={item.name} />}
        </div></div>
      <h2 className="text-2xl font-heading">Combo tương thích</h2><Links items={compatible.map((item) => ({ ...item, title: item.name }))} prefix="san-pham" />
      <h2 className="text-2xl font-heading">Sản phẩm liên quan</h2><Links items={related.map((item) => ({ ...item, title: item.name }))} prefix="san-pham" />
    </> };
  }
  if (route.collection === "post") {
    const items = await collections.posts();
    if (route.kind === "list") return { title: "Tin tức", description: text(site.profile.description, site.locale), content: <Links items={items} prefix="tin-tuc" /> };
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    return { title: item.title, description: item.excerpt, content: <>
      <Picture src={item.cover} alt={item.title} />
      <article className="space-y-5 leading-8">{Array.isArray(item.body) ? item.body.map((value, index) => {
        const line = text(value, site.locale);
        return line.startsWith("## ") ? <h2 key={index} className="text-2xl font-heading">{line.slice(3)}</h2> : <p key={index}>{line}</p>;
      }) : <RichText value={item.body} locale={site.locale} />}</article>
      <h2 className="text-2xl font-heading">Bài viết liên quan</h2><Links items={items.filter((other) => other.id !== item.id)} prefix="tin-tuc" />
    </> };
  }
  if (route.collection === "project") {
    const items = await collections.projects();
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    return { title: item.title, description: item.detail, content: <>
      <Picture src={item.image} alt={item.title} /><p>{item.location} · {item.kwp} kWp</p><p>{item.detail}</p>
      <dl className="grid gap-4 sm:grid-cols-2">{item.metrics.map(([label, value]) => <div key={label} className="t15-card p-5"><dt>{label}</dt><dd className="text-xl font-bold text-primary">{value}</dd></div>)}</dl>
      <h2 className="text-2xl font-heading">Công trình liên quan</h2><Links items={items.filter((other) => other.id !== item.id && other.segment === item.segment)} prefix="cong-trinh" />
    </> };
  }
  const items = await collections.services();
  if (route.kind === "list") return { title: "Giải pháp", description: text(site.profile.description, site.locale), content: <Links items={items.map((item) => ({ ...item, excerpt: item.audience }))} prefix="giai-phap" /> };
  const item = items.find((item) => item.slug === route.slug);
  if (!item) return null;
  return { title: item.title, description: item.problem, content: <>
    <Picture src={item.image} alt={item.title} /><p>{item.audience}</p><p>{item.problem}</p><p>{item.solution}</p><p className="font-bold text-primary">{item.price}</p>
    <dl>{item.packages.map(([label, value]) => <div key={label} className="t15-card my-3 p-5"><dt className="font-bold">{label}</dt><dd>{value}</dd></div>)}</dl>
    <h2 className="text-2xl font-heading">Công trình liên quan</h2><Links items={await collections.projects()} prefix="cong-trinh" />
  </> };
}
export async function SystemContent({ site, slug, config }: { site: TenantSite; slug: string; config: PageConfig }) {
  const collections = tenantCollections(site.tenantId, site.locale);
  const sections = <PageRenderer page={config} site={site.context} canUse={planCanUse(site.planId)} loadData={createCollectionLoader(collections.source)} />;
  if (slug === "lien-he") return <><p>{site.profile.email}</p><a className="text-primary" href={`tel:${site.profile.hotline?.replace(/\s/g, "")}`}>{site.profile.hotline}</a>{sections}</>;
  if (slug === "ve-chung-toi") return <>{sections}
    <h2 className="text-2xl font-heading">Chứng chỉ</h2><div className="grid gap-5 md:grid-cols-3">{(await collections.certificates()).map((item) => <article className="t15-card p-5" key={item.id}><Picture src={item.image} alt={item.title} /><h3>{item.title}</h3><p>{item.issuer} · {item.number} · {item.validUntil}</p></article>)}</div>
    <h2 className="text-2xl font-heading">Đội ngũ</h2><div className="grid gap-5 md:grid-cols-3">{site.profile.team.map((member, index) => <article className="t15-card p-5" key={index}><Picture src={member.image} alt={text(member.name, site.locale)} /><h3>{text(member.name, site.locale)}</h3><p>{text(member.role, site.locale)}</p></article>)}</div>
    <h2 className="text-2xl font-heading">Hành trình</h2>{site.profile.timeline.map(([year, title, body]) => <article key={year} className="t15-card p-5"><h3>{year} · {text(title, site.locale)}</h3><p>{text(body, site.locale)}</p></article>)}</>;
  if (slug !== "cam-nang") notFound();
  const guide = site.profile.guide;
  return <>{sections}<nav aria-label="Mục lục" className="flex flex-wrap gap-3">{guide.items.map((item) => <a className="t15-chip" key={item.id} href={item.href ?? `#${item.id}`}>{text(item.label, site.locale)}</a>)}</nav>
    <section id="thuat-ngu"><h2 className="text-2xl font-heading">Thuật ngữ</h2><dl>{guide.glossary.map(([term, body], index) => <div key={index} className="t15-card my-3 p-5"><dt className="font-bold">{text(term, site.locale)}</dt><dd>{text(body, site.locale)}</dd></div>)}</dl></section>
    <section id="bieu-gia"><h2 className="text-2xl font-heading">Biểu giá</h2>{guide.tariffs.map(([label, value]) => <p key={label}>{label}: {value}</p>)}</section>
    <section id="van-ban"><h2 className="text-2xl font-heading">Văn bản</h2>{guide.regulations.map((item, index) => <article key={index} className="t15-card my-3 p-5"><h3>{text(item.title, site.locale)}</h3><p>{text(item.note, site.locale)}</p></article>)}</section>
    <section id="hoi-dap"><h2 className="text-2xl font-heading">Hỏi đáp</h2>{(await collections.faqs()).map((item) => <details key={item.id} className="t15-card my-3 p-5"><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <section id="tin-tuc"><h2 className="text-2xl font-heading">Báo chí</h2>{(await collections.press()).map((item) => <article key={item.id} className="t15-card my-3 p-5"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a><p>{item.excerpt}</p></article>)}</section>
    <section id="kinh-nghiem"><h2 className="text-2xl font-heading">Kinh nghiệm</h2><Links items={await collections.posts()} prefix="tin-tuc" /></section>
  </>;
}
