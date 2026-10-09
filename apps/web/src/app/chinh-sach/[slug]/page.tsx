import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { primaryBranch, telHref } from "@/config/site";
import { makeMetadata } from "@/utils/solar";

const { policies } = siteConfig.legal;

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  return policy ? makeMetadata(policy.title, policy.summary, `/chinh-sach/${slug}`) : {};
}

/** Trang chính sách — nội dung placeholder, thay bằng văn bản chính thức của công ty. */
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  if (!policy) notFound();

  return (
    <main>
      <section className="t15-page-hero">
        <div className="t15-container">
          <span className="t15-eyebrow">Chính sách</span>
          <h1 className="t15-page-title">{policy.title}</h1>
          <p className="t15-page-desc">{policy.summary}</p>
        </div>
      </section>
      <section className="t15-section">
        <div className="t15-container grid gap-10 lg:grid-cols-[1fr_280px]">
          <article className="t15-card p-6 leading-8 text-fg-muted sm:p-10">
            <p className="font-bold text-fg">[NỘI DUNG MẪU] Văn bản chính sách chính thức của {siteConfig.brand.legalName} sẽ được đặt tại đây.</p>
            <p className="mt-4">Khi thay nội dung, nên nêu rõ: phạm vi áp dụng, điều kiện, thời hạn, quy trình tiếp nhận và đầu mối liên hệ. Thông tin pháp lý phải khớp với giấy phép và hợp đồng thực tế.</p>
            <p className="mt-4">Mọi thắc mắc, vui lòng gọi hotline khiếu nại <a className="font-black text-primary" href={telHref(siteConfig.complaintHotline)}>{siteConfig.complaintHotline}</a> hoặc tổng đài <a className="font-black text-primary" href={telHref(primaryBranch.hotline.main)}>{primaryBranch.hotline.main}</a>.</p>
          </article>
          <nav aria-label="Các chính sách khác" className="grid content-start gap-2">
            {policies.map((p) => (
              <Link key={p.slug} href={`/chinh-sach/${p.slug}`} aria-current={p.slug === slug ? "page" : undefined}
                className={`t15-filter-option ${p.slug === slug ? "is-active" : ""}`}>{p.title}</Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
