import Image from "next/image";
import Link from "next/link";
import { ARTICLES, COPY } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
export const metadata = makeMetadata(
  COPY.news.title,
  COPY.news.description,
  "/news",
);
export default function Page() {
  return (
    <main>
      <section className="t5-page-hero">
        <div className="t5-container">
          <h1 className="t5-page-title">{COPY.news.title}</h1>
          <p className="t5-page-desc">{COPY.news.description}</p>
        </div>
      </section>
      <section className="t5-section">
        <div className="t5-container grid gap-6 md:grid-cols-3">
          {ARTICLES.map((a) => (
            <article key={a.id} className="t8-card overflow-hidden">
              <Link href={`/news/${a.id}`}>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={a.image.src}
                    alt={a.image.alt}
                    fill
                    sizes="(min-width:768px) 33vw, 95vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-black leading-7">{a.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {a.description}
                  </p>
                  <p className="mt-5 font-bold text-blue-900">
                    {COPY.news.read} ↗
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
