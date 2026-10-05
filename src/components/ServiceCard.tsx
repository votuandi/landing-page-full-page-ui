"use client";
import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types";

export default function ServiceCard({ service }: { service: Service }) {
  const labels: Record<string,string>={household:"Hộ gia đình",business:"Doanh nghiệp",maintenance:"Bảo trì",consultation:"Tư vấn"};
  return (
    <Link href={`/service/${service.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_16px_45px_rgba(120,75,20,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(120,75,20,0.14)]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image src={service.image} alt={service.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-[#fff8ed]/95 px-3 py-1 text-xs font-bold text-orange-700">{labels[service.category] || "Dịch vụ"}</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-black text-stone-900 transition group-hover:text-orange-600">{service.title}</h3>
          <p className="mt-3 line-clamp-3 leading-7 text-stone-600">{service.description}</p>
          <ul className="mt-5 space-y-2">{service.features.slice(0,3).map(feature=><li key={feature} className="flex gap-2 text-sm text-stone-600"><span className="mt-1 text-orange-500">●</span>{feature}</li>)}</ul>
          <div className="mt-auto flex items-end justify-between border-t border-orange-100 pt-5">
            <div><div className="text-xl font-black text-orange-600">{service.price}</div>{service.duration&&<div className="mt-1 text-xs text-stone-500">{service.duration}</div>}</div>
            <span className="font-bold text-orange-600">Chi tiết →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
