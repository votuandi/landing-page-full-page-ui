"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Props {id:number;title:string;excerpt:string;author:string;date?:string;publishedAt?:string;image?:string;imageUrl?:string;category:string;readTime:string;}
export default function NewsCard({id,title,excerpt,author,date,publishedAt,image,imageUrl,category,readTime}:Props){
 const [error,setError]=useState(false); const src=image||imageUrl||"";
 return <Link href={`/news/${id}`} className="group block h-full">
  <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_14px_40px_color-mix(in srgb,var(--solar-primary-dark) 7%,transparent)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_color-mix(in srgb,var(--solar-primary-dark) 13%,transparent)]">
   <div className="relative aspect-[16/10] overflow-hidden bg-[var(--solar-surface)]">
    {!error&&src?<Image src={src} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" onError={()=>setError(true)} sizes="(max-width:768px) 100vw, 33vw"/>:<div className="flex h-full items-center justify-center text-stone-400">Minwy Solar</div>}
    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent"/>
    <span className="absolute left-4 top-4 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-stone-900">{category}</span>
    <span className="absolute bottom-4 right-4 rounded-full bg-stone-950/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{readTime}</span>
   </div>
   <div className="flex flex-1 flex-col p-6">
    <h3 className="text-xl font-black leading-snug text-stone-900 transition group-hover:text-[var(--solar-primary-dark)]">{title}</h3>
    <p className="mt-3 line-clamp-3 leading-7 text-stone-600">{excerpt}</p>
    <div className="mt-auto flex items-center justify-between border-t border-orange-100 pt-5 text-sm"><div><div className="font-bold text-stone-700">{author}</div><div className="text-stone-400">{date||publishedAt}</div></div><span className="font-bold text-[var(--solar-primary-dark)]">Đọc bài →</span></div>
   </div>
  </article>
 </Link>
}
