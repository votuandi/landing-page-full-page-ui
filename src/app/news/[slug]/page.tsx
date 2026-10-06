import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, COPY } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = ARTICLES.find((a) => a.id === slug);
  return a
    ? makeMetadata(a.title, a.description, `/news/${slug}`, a.image.src)
    : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = ARTICLES.find((a) => a.id === slug);
  if (!a) notFound();
  return (
    <main className="t5-section">
      <article className="t5-container max-w-4xl">
        <Link href="/news" className="t5-button t5-button-secondary">
          ← {COPY.news.back}
        </Link>
        <h1 className="t5-heading">{a.title}</h1>
        <p className="t5-subheading">{a.description}</p>
        <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-[28px]">
          <Image
            src={a.image.src}
            alt={a.image.alt}
            fill
            priority
            sizes="(min-width:768px) 850px, 95vw"
            className="object-cover"
          />
        </div>
        {a.paragraphs.map((p) => (
          <p key={p} className="my-5 leading-8 text-slate-700">
            {p}
          </p>
        ))}
        <p className="mt-8 text-xs text-slate-600">{COPY.demo}</p>
      </article>
    </main>
  );
}
