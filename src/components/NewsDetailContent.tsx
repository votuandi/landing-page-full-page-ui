"use client";

import Image from "next/image";
import Link from "next/link";
import { NewsArticle } from "@/types";
import { SITE_CONFIG } from "@/utils/constants";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  PhoneIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface NewsDetailContentProps { article: NewsArticle; }

export default function NewsDetailContent({ article }: NewsDetailContentProps) {
  const related = [
    { id: 1, title: "5 tiêu chí chọn inverter cho hệ thống dân dụng", image: "/images/news-2.jpg", category: "Kỹ thuật" },
    { id: 2, title: "Khi nào nên đầu tư pin lưu trữ cho gia đình?", image: "/images/news-3.jpg", category: "Giải pháp" },
    { id: 3, title: "Cách đọc sản lượng điện mặt trời sau khi lắp đặt", image: "/images/news-4.jpg", category: "Vận hành" },
  ].filter((item)=>item.title!==article.title).slice(0,2);

  return (
    <main className="bg-[var(--solar-white)] text-[var(--solar-primary-dark)]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[var(--solar-primary-dark)]">Trang chủ</Link><span>/</span>
          <Link href="/news" className="hover:text-[var(--solar-primary-dark)]">Tin tức</Link><span>/</span>
          <span className="truncate text-slate-700">{article.title}</span>
        </nav>
      </div>

      <article>
        <header className="border-y border-emerald-950/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[.88fr_1.12fr] lg:px-8 lg:py-16">
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[var(--solar-primary-dark)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white">{article.category}</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500"><ClockIcon className="h-4 w-4" />{article.readTime}</span>
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.04em] md:text-6xl">{article.title}</h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">{article.excerpt}</p>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-emerald-950/10 pt-5 text-sm text-slate-500">
                <span className="font-bold text-[var(--solar-primary-dark)]">{article.author === "Administrator" ? "Ban biên tập Minwy Solar" : article.author}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4" />{article.date}</span>
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--solar-surface)]">
              <Image src={article.image} alt={article.title} fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 55vw" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--solar-primary-dark)]/55 to-transparent px-5 pb-5 pt-16 text-xs font-semibold text-white/90">Góc nhìn kỹ thuật & thị trường năng lượng mặt trời</div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-16">
          <div>
            <div className="border border-emerald-950/10 bg-white p-6 md:p-9">
              <div
                className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-[-0.025em] prose-headings:text-[var(--solar-primary-dark)] prose-h2:mt-10 prose-h3:mt-8 prose-p:leading-8 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-[var(--solar-primary-dark)] prose-a:text-[var(--solar-primary-dark)]"
                dangerouslySetInnerHTML={{ __html: article.content || "" }}
              />
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <TagIcon className="h-5 w-5 text-[var(--solar-primary-dark)]" />
                {article.tags.map((tag)=><span key={tag} className="rounded-full border border-emerald-950/10 bg-white px-3 py-2 text-xs font-bold text-slate-600">{tag}</span>)}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-4 border-y border-emerald-950/10 py-6 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/news" className="inline-flex items-center gap-2 font-black text-[var(--solar-primary-dark)]"><ArrowLeftIcon className="h-5 w-5" /> Quay lại tin tức</Link>
              <a href="#solar-consult" className="inline-flex items-center gap-2 font-black text-[var(--solar-primary-dark)]">Tư vấn giải pháp solar <ArrowRightIcon className="h-5 w-5" /></a>
            </div>

            <section className="mt-12">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--solar-primary-dark)]">Đọc tiếp</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">Bài viết liên quan</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {related.map((item)=><Link href="/news" key={item.title} className="group overflow-hidden border border-emerald-950/10 bg-white"><div className="relative aspect-[16/9] overflow-hidden"><Image src={item.image} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--solar-primary-dark)]">{item.category}</div><h3 className="mt-2 text-lg font-black leading-snug">{item.title}</h3><div className="mt-4 text-sm font-black text-[var(--solar-primary-dark)]">Đọc bài →</div></div></Link>)}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div id="solar-consult" className="sticky top-24 bg-[var(--solar-primary-dark)] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--solar-primary)]">Từ thông tin đến hành động</div>
              <h2 className="mt-3 text-2xl font-black">Muốn biết hệ solar nào phù hợp công trình của bạn?</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/70">Gửi hóa đơn điện và loại mái, đội kỹ thuật sẽ giúp ước tính công suất và mức đầu tư tham khảo.</p>
              <a href={`tel:${SITE_CONFIG.phone}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--solar-primary)] px-4 py-3 font-black text-[var(--solar-primary-dark)]"><PhoneIcon className="h-5 w-5" />{SITE_CONFIG.displayPhone}</a>
              <a href={SITE_CONFIG.zalo} className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-3 font-black">Chat Zalo</a>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-emerald-50/55">Nội dung bài viết mang tính tham khảo và nên được đối chiếu với điều kiện công trình thực tế.</p>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
