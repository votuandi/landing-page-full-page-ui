import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageRenderer, RichText, createCollectionLoader, serializeJsonLd, type PageConfig } from "@solar/sections";
import { MediaImage, PriceTag } from "@solar/ui";
import ProductCatalog from "@/components/ProductCatalog";
import ProductImage from "@/components/ProductImage";
import AddToQuoteButton from "@/components/AddToQuoteButton";
import LeadForm from "@/components/LeadForm";
import { SEGMENT_SLUGS, formatMoneyShort, type Segment } from "@solar/core";
import { tenantCollections } from "@/lib/tenant/collections";
import { siteCanUse, type TenantSite } from "@/lib/tenant/siteData";
import { text } from "@/lib/tenant/contentSchemas";
import type { Route } from "@/lib/tenant/routes";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, siteOrigin } from "@/lib/tenant/seo";

function Links({ items, prefix }: { items: { id: string; slug: string; title: string; excerpt?: string; image?: string; cover?: string; meta?: string; price?: string | number }[]; prefix: string }) {
  return <div className="grid gap-5 md:grid-cols-3">{items.map((item) => <article key={item.id} className="t15-card p-6">
    {(item.image || item.cover) && <Picture src={(item.image || item.cover)!} alt={item.title} />}
    <h2 className="text-xl font-heading"><Link href={`/${prefix}/${item.slug}`} className="hover:text-primary">{item.title}</Link></h2>
    {item.meta && <p className="mt-3 text-sm text-fg-muted">{item.meta}</p>}
    {item.excerpt && <p className="mt-3 text-fg-muted">{item.excerpt}</p>}
    {item.price && <p className="mt-3 font-bold text-primary">{item.price}</p>}
  </article>)}</div>;
}
export function JsonLd({ value }: { value: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />;
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
  const t = (vi: string, en: string) => site.locale === "en" ? en : vi;
  const segmentLabel = (value?: string) => value ? ({ household: t("Hộ gia đình", "Household"), shop: t("Cửa hàng", "Shop"), factory: t("Nhà xưởng", "Factory"), farm: t("Trang trại", "Farm") }[value] ?? value) : t("Kinh nghiệm", "Insights");
  const collections = tenantCollections(site.tenantId, site.locale, site.siteId);
  const origin = siteOrigin(site);
  const home: [string, string] = [t("Trang chủ", "Home"), "/"];
  const crumbs = (...items: [string, string][]) => <JsonLd value={breadcrumbJsonLd(origin, [home, ...items])} />;
  if (route.kind === "policy") {
    const policy = site.profile.legal.policies.find((item) => item.slug === route.slug);
    if (!policy) return null;
    return { title: text(policy.title, site.locale), description: text(policy.summary, site.locale), content: <>
      {crumbs([text(policy.title, site.locale), `/chinh-sach/${policy.slug}`])}
      <article className="t15-card space-y-5 p-6 leading-8"><RichText value={policy.body} locale={site.locale} /></article>
      <nav aria-label={t("Các chính sách khác", "Other policies")} className="flex flex-wrap gap-3">{site.profile.legal.policies.map((item) => <Link className="t15-chip" key={item.slug} href={`/chinh-sach/${item.slug}`}>{text(item.title, site.locale)}</Link>)}</nav>
    </> };
  }
  if (route.collection === "product") {
    const items = await collections.products();
    if (route.kind === "list") return { title: t("Sản phẩm", "Products"), description: text(site.profile.description, site.locale), content: <ProductCatalog products={items} categories={[...new Map(items.map((item) => [item.category, { value: item.category, label: item.categoryLabel }])).values()]} /> };
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    const related = items.filter((other) => other.id !== item.id && other.category === item.category);
    const compatible = items.filter((other) => item.compatible?.includes(other.slug));
    const cartEnabled = site.widgets["quote-cart"]?.enabled && siteCanUse(site)("quoteCart");
    return { title: item.name, image: item.images[0], description: `${item.brand} · ${item.warranty}`, content: <>
      <JsonLd value={productJsonLd(origin, `/san-pham/${item.slug}`, item)} />{crumbs([t("Sản phẩm", "Products"), "/san-pham"], [item.name, `/san-pham/${item.slug}`])}
      <div className="grid gap-8 md:grid-cols-2"><div className="grid gap-4">{item.images.map((src) => <div key={src} className="relative aspect-square overflow-hidden rounded-media bg-bg-tint"><ProductImage src={src} alt={item.name} fill sizes="(max-width:768px) 100vw, 50vw" className="object-contain" /></div>)}</div>
        <div className="t15-card p-6"><p>{item.brand} · {item.categoryLabel}</p><div className="my-4 flex items-baseline gap-2"><PriceTag locale={site.locale} price={item.price} salePrice={item.salePrice} className="text-2xl" />{item.unit && <span>/{item.unit}</span>}</div>
          <dl>{Object.entries(item.specs).map(([key, value]) => <div className="flex justify-between gap-4 border-b border-line/10 py-3" key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
          <p className="my-5">{t("Bảo hành", "Warranty")}: {item.warranty}</p>{item.datasheet && <a href={item.datasheet} className="t15-button t15-button-secondary" target="_blank" rel="noopener noreferrer">{t("Tải datasheet", "Download datasheet")}</a>}{cartEnabled && <AddToQuoteButton sku={item.slug} name={item.name} />}
        </div></div>
      <h2 className="text-2xl font-heading">{t("Combo tương thích", "Compatible bundles")}</h2><Links items={compatible.map((item) => ({ ...item, title: item.name }))} prefix="san-pham" />
      <h2 className="text-2xl font-heading">{t("Sản phẩm liên quan", "Related products")}</h2><Links items={related.map((item) => ({ ...item, title: item.name }))} prefix="san-pham" />
    </> };
  }
  if (route.collection === "post") {
    const items = await collections.posts();
    if (route.kind === "list") return { title: t("Tin tức", "News"), description: text(site.profile.description, site.locale), content: <Links items={items.map((item) => ({ ...item, meta: `${segmentLabel(item.segment)} · ${item.readMinutes} ${t("phút đọc", "min read")}` }))} prefix="tin-tuc" /> };
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    return { title: item.title, image: item.cover, description: item.excerpt, content: <>
      {crumbs([t("Tin tức", "News"), "/tin-tuc"], [item.title, `/tin-tuc/${item.slug}`])}<Picture src={item.cover} alt={item.title} />
      <article className="space-y-5 leading-8">{Array.isArray(item.body) ? item.body.map((value, index) => {
        const line = text(value, site.locale);
        return line.startsWith("## ") ? <h2 key={index} className="text-2xl font-heading">{line.slice(3)}</h2> : <p key={index}>{line}</p>;
      }) : <RichText value={item.body} locale={site.locale} />}</article>
      {siteCanUse(site)("calculator") && <Link className="t15-button t15-button-primary" href={item.segment ? `/?phan-khuc=${SEGMENT_SLUGS[item.segment as Segment]}#du-toan` : "/#du-toan"}>{t("Dự toán chi phí", "Estimate costs")}</Link>}
      <h2 className="text-2xl font-heading">{t("Bài viết liên quan", "Related posts")}</h2><Links items={items.filter((other) => other.id !== item.id)} prefix="tin-tuc" />
    </> };
  }
  if (route.collection === "project") {
    const items = await collections.projects();
    const item = items.find((item) => item.slug === route.slug);
    if (!item) return null;
    return { title: item.title, image: item.image, description: item.detail, content: <>
      {crumbs([item.title, `/cong-trinh/${item.slug}`])}<Picture src={item.image} alt={item.title} /><p>{item.location} · {item.kwp} kWp</p><p>{item.detail}</p>{item.savingPerMonth !== undefined && <p>{t("Tiết kiệm mỗi tháng", "Monthly savings")}: {formatMoneyShort(item.savingPerMonth)}</p>}
      <dl className="grid gap-4 sm:grid-cols-2">{item.metrics.map(([label, value]) => <div key={label} className="t15-card p-5"><dt>{label}</dt><dd className="text-xl font-bold text-primary">{value}</dd></div>)}</dl>
      <Link href="/lien-he" className="t15-button t15-button-primary">{t("Nhận báo giá công trình tương tự", "Get a quote for a similar project")}</Link>
      <h2 className="text-2xl font-heading">{t("Công trình liên quan", "Related projects")}</h2><Links items={items.filter((other) => other.id !== item.id && other.segment === item.segment)} prefix="cong-trinh" />
    </> };
  }
  const items = await collections.services();
  if (route.kind === "list") return { title: t("Giải pháp", "Solutions"), description: text(site.profile.description, site.locale), content: <Links items={items.map((item) => ({ ...item, excerpt: item.solution, meta: item.audience }))} prefix="giai-phap" /> };
  const item = items.find((item) => item.slug === route.slug);
  if (!item) return null;
  return { title: item.title, image: item.image, description: item.problem, content: <>
    {crumbs([t("Giải pháp", "Solutions"), "/giai-phap"], [item.title, `/giai-phap/${item.slug}`])}<Picture src={item.image} alt={item.title} /><p>{item.audience}</p><p>{item.problem}</p><p>{item.solution}</p><p className="font-bold text-primary">{item.price}</p>
    <dl>{item.packages.map(([label, value]) => <div key={label} className="t15-card my-3 p-5"><dt className="font-bold">{label}</dt><dd>{value}</dd></div>)}</dl>
    <h2 className="text-2xl font-heading">{t("Quy trình", "Process")}</h2><ol className="grid gap-3 md:grid-cols-5">{(item.steps ?? [t("Khảo sát & thu thập dữ liệu", "Survey and data collection"), t("Thiết kế và mô phỏng", "Design and simulation"), t("Chốt cấu hình & kế hoạch", "Configuration and planning"), t("Thi công / thực hiện", "Installation"), t("Nghiệm thu & bàn giao", "Acceptance and handover")]).map((step, index) => <li key={index} className="t15-card p-5">{index + 1}. {step}</li>)}</ol>
    <h2 className="text-2xl font-heading">{t("Công trình liên quan", "Related projects")}</h2><Links items={(await collections.projects()).filter((project) => project.segment === item.segment)} prefix="cong-trinh" />
    <h2 className="text-2xl font-heading">{item.slug === "om-ve-sinh" ? t("Đặt lịch O&M", "Book O&M") : t("Đặt lịch khảo sát kỹ thuật", "Book a technical survey")}</h2>
    <LeadForm source={`service-${item.slug}`} hotline={site.profile.hotline ?? ""} fields={{ zalo: true, address: true, message: true }} />
  </> };
}
export async function SystemContent({ site, slug, config }: { site: TenantSite; slug: string; config: PageConfig }) {
  const t = (vi: string, en: string) => site.locale === "en" ? en : vi;
  const collections = tenantCollections(site.tenantId, site.locale, site.siteId);
  const sections = <PageRenderer page={config} site={site.context} canUse={siteCanUse(site)} loadData={createCollectionLoader(collections.source)} />;
  if (slug === "lien-he") return <><p>{site.profile.email}</p><a className="text-primary" href={`tel:${site.profile.hotline?.replace(/\s/g, "")}`}>{site.profile.hotline}</a>{sections}</>;
  if (slug === "ve-chung-toi") return <>{sections}
    <h2 className="text-2xl font-heading">{t("Chứng chỉ", "Certificates")}</h2><div className="grid gap-5 md:grid-cols-3">{(await collections.certificates()).map((item) => <article className="t15-card p-5" key={item.id}><Picture src={item.image} alt={item.title} /><h3>{item.title}</h3><p>{item.issuer} · {item.number} · {item.validUntil}</p></article>)}</div>
    <h2 className="text-2xl font-heading">{t("Đội ngũ", "Team")}</h2><div className="grid gap-5 md:grid-cols-3">{site.profile.team.map((member, index) => <article className="t15-card p-5" key={index}><Picture src={member.image} alt={text(member.name, site.locale)} /><h3>{text(member.name, site.locale)}</h3><p>{text(member.role, site.locale)}</p></article>)}</div>
    <h2 className="text-2xl font-heading">{t("Hành trình", "Timeline")}</h2>{site.profile.timeline.map(([year, title, body]) => <article key={year} className="t15-card p-5"><h3>{year} · {text(title, site.locale)}</h3><p>{text(body, site.locale)}</p></article>)}</>;
  if (slug !== "cam-nang") notFound();
  const guide = site.profile.guide;
  const faqs = await collections.faqs();
  return <>{sections}<nav aria-label={t("Mục lục", "Table of contents")} className="flex flex-wrap gap-3">{guide.items.map((item) => <a className="t15-chip" key={item.id} href={item.href ?? `#${item.id}`}>{text(item.label, site.locale)}</a>)}</nav>
    <section id="thuat-ngu"><h2 className="text-2xl font-heading">{t("Thuật ngữ", "Glossary")}</h2><dl>{guide.glossary.map(([term, body], index) => <div key={index} className="t15-card my-3 p-5"><dt className="font-bold">{text(term, site.locale)}</dt><dd>{text(body, site.locale)}</dd></div>)}</dl></section>
    <section id="bieu-gia"><h2 className="text-2xl font-heading">{t("Biểu giá", "Tariffs")}</h2>{guide.tariffs.map(([label, value]) => <p key={label}>{label}: {value}</p>)}</section>
    <section id="van-ban"><h2 className="text-2xl font-heading">{t("Văn bản", "Regulations")}</h2>{guide.regulations.map((item, index) => <article key={index} className="t15-card my-3 p-5"><h3>{text(item.title, site.locale)}</h3><p>{text(item.note, site.locale)}</p></article>)}</section>
    <section id="hoi-dap"><h2 className="text-2xl font-heading">{t("Hỏi đáp", "FAQ")}</h2>{faqs.length > 0 && <JsonLd value={faqJsonLd(faqs)} />}{faqs.map((item) => <details key={item.id} className="t15-card my-3 p-5"><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <section id="tin-tuc"><h2 className="text-2xl font-heading">{t("Báo chí", "Press")}</h2>{(await collections.press()).map((item) => <article key={item.id} className="t15-card my-3 p-5"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a><p>{item.excerpt}</p></article>)}</section>
    <section id="kinh-nghiem"><h2 className="text-2xl font-heading">{t("Kinh nghiệm", "Insights")}</h2><Links items={await collections.posts()} prefix="tin-tuc" /></section>
  </>;
}
