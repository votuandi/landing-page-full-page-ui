"use client";
import { useState } from "react";
import ServiceCard from "./ServiceCard";
import { SERVICES, SERVICE_CATEGORIES } from "@/utils/constants";

export default function AllServicesSection(){
 const [selected,setSelected]=useState("all");
 const filtered=selected==="all"?SERVICES:SERVICES.filter(s=>s.category===selected);
 return <section className="bg-[#fffaf0] py-16 md:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="text-sm font-black uppercase tracking-[.18em] text-orange-600">Năng lực triển khai</span><h2 className="mt-2 text-3xl font-black text-stone-900 md:text-4xl">Chọn dịch vụ phù hợp công trình</h2></div><p className="max-w-xl leading-7 text-stone-600">Từ hệ thống gia đình đến doanh nghiệp, đội ngũ Minwy Solar đồng hành theo một quy trình thống nhất và minh bạch.</p></div>
  <div className="mb-10 flex flex-wrap gap-3 rounded-[2rem] border border-orange-100 bg-white p-3 shadow-sm">{SERVICE_CATEGORIES.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={`rounded-full px-5 py-3 text-sm font-bold transition ${selected===c.id?"bg-orange-600 text-white shadow-lg shadow-orange-100":"bg-[#fff8ed] text-stone-600 hover:bg-orange-50 hover:text-orange-700"}`}>{c.name}<span className="ml-2 opacity-60">{c.count}</span></button>)}</div>
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map(s=><ServiceCard key={s.id} service={s}/>)}</div>
 </div></section>
}
