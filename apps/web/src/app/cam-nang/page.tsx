import { siteConfig } from "@/config/site.config";
import { TARIFFS, VAT_RATE } from "@/config/solar";
import Link from "next/link";
import { FAQS } from "@/data/faq";
import { POSTS } from "@/data/posts";
import { makeMetadata } from "@/utils/solar";
import { formatNumber } from "@/lib/format";
import { Tr } from "@/i18n/LangProvider";
import { ArticleCard } from "@/components/sections/PressSection";
import PostCard from "@/components/PostCard";

export const metadata = makeMetadata(
  "Cẩm nang điện mặt trời",
  "Thuật ngữ, biểu giá điện, văn bản pháp luật, hỏi đáp và tin tức về điện mặt trời mái nhà.",
  "/cam-nang"
);

const { guide, press } = siteConfig;
const label = (id: string) => guide.items.find((i) => i.id === id)?.label || id;
const FLAT: { seg: "shop" | "factory" | "farm"; title: string }[] = [
  { seg: "shop", title: "Kinh doanh (dưới 6 kV)" },
  { seg: "factory", title: "Sản xuất (6–22 kV)" },
  { seg: "farm", title: "Trang trại (giá sản xuất, dưới 6 kV)" },
];

function Block({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-line/12 py-14 first:border-0">
      <h2 className="text-3xl font-black tracking-[-.03em] text-fg sm:text-4xl"><Tr text={label(id)} /></h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  const household = TARIFFS.household.kind === "tiered" ? TARIFFS.household.tiers : [];
  let from = 0;

  return (
    <main>
      <section className="t15-page-hero">
        <div className="t15-container">
          <span className="t15-eyebrow"><Tr vi="Cẩm nang" en="Guides" /></span>
          <h1 className="t15-page-title"><Tr vi="Hiểu đúng trước khi đầu tư điện mặt trời." en="Understand solar before you invest." /></h1>
          <nav aria-label="Mục lục" className="mt-8 flex flex-wrap gap-2">
            {guide.items.map((i) => <a key={i.id} href={i.href || `#${i.id}`} className="t15-chip"><Tr text={i.label} /></a>)}
          </nav>
        </div>
      </section>

      <div className="t15-container">
        <Block id="thuat-ngu">
          <dl className="grid gap-4 md:grid-cols-2">
            {guide.glossary.map(([term, def]) => (
              <div key={term} className="t15-card p-5"><dt className="font-black text-primary">{term}</dt><dd className="mt-2 text-sm leading-6 text-fg-muted">{def}</dd></div>
            ))}
          </dl>
        </Block>

        <Block id="bieu-gia">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="t15-card overflow-x-auto p-5">
              <h3 className="font-black text-fg">Sinh hoạt — bậc thang (đ/kWh, chưa VAT)</h3>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[.12em] text-fg-subtle"><tr><th className="py-2">Bậc</th><th>Mức sử dụng</th><th className="text-right">Đơn giá</th></tr></thead>
                <tbody>
                  {household.map((t, i) => {
                    const range = t.upTo ? `${from + 1} – ${t.upTo} kWh` : `Từ ${from + 1} kWh`;
                    from = t.upTo ?? from;
                    return <tr key={i} className="border-t border-line/12"><td className="py-2.5 font-bold">{i + 1}</td><td className="text-fg-muted">{range}</td><td className="text-right font-black tabular-nums">{formatNumber(t.price)}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid content-start gap-4">
              {FLAT.map(({ seg, title }) => {
                const t = TARIFFS[seg];
                if (t.kind !== "flat") return null;
                return (
                  <div key={seg} className="t15-card p-5">
                    <h3 className="font-black text-fg">{title}</h3>
                    <p className="mt-2 text-sm text-fg-muted">Giá bình quân dùng để quy đổi: <strong className="text-fg">{formatNumber(t.averageRate)} đ/kWh</strong></p>
                  </div>
                );
              })}
              <p className="text-xs leading-6 text-fg-subtle">Giá mẫu dùng cho công cụ dự toán, chưa gồm VAT {Math.round(VAT_RATE * 100)}%. [CẦN XÁC MINH với biểu giá EVN hiện hành — sửa tại src/config/solar.ts]</p>
            </div>
          </div>
        </Block>

        <Block id="van-ban">
          <ul className="grid gap-3">
            {guide.regulations.map((r) => (
              <li key={r.title} className="t15-card p-5"><div className="font-black text-fg">{r.title}</div><p className="mt-1 text-sm text-fg-muted">{r.note}</p></li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-fg-subtle">Danh mục tóm tắt để tham khảo, không thay thế tư vấn pháp lý. Đối chiếu văn bản gốc tại thời điểm triển khai.</p>
        </Block>

        <Block id="hoi-dap">
          <div className="grid gap-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="t15-card group px-6 py-5">
                <summary className="cursor-pointer list-none pr-8 font-black text-fg">{q}<span aria-hidden className="float-right -mr-8 grid h-7 w-7 place-items-center rounded-full bg-bg-tint text-primary transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 text-sm leading-7 text-fg-muted">{a}</p>
              </details>
            ))}
          </div>
        </Block>

        <Block id="tin-tuc">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {press.articles.map((a) => <ArticleCard key={a.url} a={a} />)}
          </div>
        </Block>

        <Block id="kinh-nghiem">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.slice(0, 3).map((p) => <PostCard key={p.slug} post={p} />)}
          </div>
          <Link href="/tin-tuc" className="t15-button t15-button-secondary mt-8">Tất cả bài viết →</Link>
        </Block>
      </div>
    </main>
  );
}
