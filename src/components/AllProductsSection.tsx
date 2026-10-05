"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type Product = {
  id:number; name:string; price:string; originalPrice?:string; image:string;
  specs:string[]; discount?:number; category:string; priceNumber:number;
};

const products: Product[] = [
{id:1,name:"Biến Tần Growatt MIN 3000TL-XE",price:"8,500,000đ",originalPrice:"9,200,000đ",image:"/images/product-1.jpg",specs:["3kW","MPPT Dual","WiFi Monitor","IP65"],discount:8,category:"Biến Tần Inverter",priceNumber:8500000},
{id:2,name:"Biến Tần Huawei SUN2000-5KTL-L1",price:"12,800,000đ",originalPrice:"14,000,000đ",image:"/images/product-1.jpg",specs:["5kW","Smart String","AI Monitoring","IP65"],discount:9,category:"Biến Tần Inverter",priceNumber:12800000},
{id:3,name:"Biến Tần SolarEdge SE7600H-RWS",price:"22,500,000đ",image:"/images/product-1.jpg",specs:["7.6kW","Power Optimizer","HD-Wave","StorEdge Ready"],category:"Biến Tần Inverter",priceNumber:22500000},
{id:4,name:"Biến Tần Fronius Symo 8.2-3-M",price:"28,900,000đ",originalPrice:"31,500,000đ",image:"/images/product-1.jpg",specs:["8.2kW","SnapINverter","WiFi","SuperFlex Design"],discount:8,category:"Biến Tần Inverter",priceNumber:28900000},
{id:5,name:"Biến Tần ABB UNO-DM-6.0-TL-PLUS",price:"16,800,000đ",image:"/images/product-1.jpg",specs:["6kW","Transformerless","React Quick","IP65"],category:"Biến Tần Inverter",priceNumber:16800000},
{id:6,name:"Biến Tần Sungrow SG10RT",price:"19,200,000đ",originalPrice:"21,000,000đ",image:"/images/product-1.jpg",specs:["10kW","String Inverter","AFCI Protection","Smart O&M"],discount:9,category:"Biến Tần Inverter",priceNumber:19200000},
{id:7,name:"Biến Tần SMA Sunny Boy 6.0",price:"24,500,000đ",image:"/images/product-1.jpg",specs:["6kW","OptiTrac Global Peak","Webconnect","Secure Power"],category:"Biến Tần Inverter",priceNumber:24500000},
{id:8,name:"Biến Tần GoodWe GW10K-DT",price:"18,600,000đ",originalPrice:"20,200,000đ",image:"/images/product-1.jpg",specs:["10kW","Dual MPPT","WiFi Monitoring","Anti-PID"],discount:8,category:"Biến Tần Inverter",priceNumber:18600000},
{id:9,name:"Pin Lithium Pylontech US3000C",price:"18,500,000đ",originalPrice:"20,000,000đ",image:"/images/product-2.jpg",specs:["3.55kWh","LiFePO4","6000 Cycles","Modular Design"],discount:8,category:"Pin Lưu Trữ Lithium",priceNumber:18500000},
{id:10,name:"Pin Lithium BYD Battery-Box Premium LVS",price:"45,800,000đ",originalPrice:"49,500,000đ",image:"/images/product-2.jpg",specs:["4kWh","High Voltage","10 Year Warranty","Scalable"],discount:7,category:"Pin Lưu Trữ Lithium",priceNumber:45800000},
{id:11,name:"Pin Lithium Tesla Powerwall 2",price:"185,000,000đ",image:"/images/product-2.jpg",specs:["13.5kWh","AC Coupled","Weather Resistant","Mobile App"],category:"Pin Lưu Trữ Lithium",priceNumber:185000000},
{id:12,name:"Pin Lithium Huawei LUNA2000-5kWh",price:"35,200,000đ",originalPrice:"38,000,000đ",image:"/images/product-2.jpg",specs:["5kWh","Smart Control","Fast Charging","Compact Design"],discount:7,category:"Pin Lưu Trữ Lithium",priceNumber:35200000},
{id:13,name:"Pin Lithium LG Chem RESU10H",price:"65,500,000đ",image:"/images/product-2.jpg",specs:["9.8kWh","High Energy Density","10 Year Warranty","Indoor/Outdoor"],category:"Pin Lưu Trữ Lithium",priceNumber:65500000},
{id:14,name:"Pin Lithium Sonnen eco 8",price:"120,000,000đ",originalPrice:"135,000,000đ",image:"/images/product-2.jpg",specs:["8kWh","All-in-One","Smart Grid Ready","10,000 Cycles"],discount:11,category:"Pin Lưu Trữ Lithium",priceNumber:120000000},
{id:15,name:"Pin Lithium Alpha ESS SMILE5",price:"42,800,000đ",image:"/images/product-2.jpg",specs:["5.7kWh","Modular System","EMS Integrated","Safe Chemistry"],category:"Pin Lưu Trữ Lithium",priceNumber:42800000},
{id:16,name:"Pin Lithium Goodwe Lynx Home F",price:"28,900,000đ",originalPrice:"31,500,000đ",image:"/images/product-2.jpg",specs:["6.5kWh","Stackable","IP65 Rating","Smart BMS"],discount:8,category:"Pin Lưu Trữ Lithium",priceNumber:28900000},
{id:17,name:"Tấm Pin Canadian Solar BiHiKu7 CS7L-MS 580W",price:"3,200,000đ",originalPrice:"3,500,000đ",image:"/images/product-3.jpg",specs:["580W","Mono PERC","21.4% Efficiency","25 Year Warranty"],discount:9,category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:3200000},
{id:18,name:"Tấm Pin JinkoSolar Tiger Neo N-type 575W",price:"3,450,000đ",image:"/images/product-3.jpg",specs:["575W","N-Type TOPCon","22.3% Efficiency","Low Degradation"],category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:3450000},
{id:19,name:"Tấm Pin Longi Hi-MO 6 Explorer LR5-72HTH 560W",price:"3,150,000đ",originalPrice:"3,400,000đ",image:"/images/product-3.jpg",specs:["560W","PERC Technology","21.7% Efficiency","Anti-LID"],discount:7,category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:3150000},
{id:20,name:"Tấm Pin Trina Solar Vertex S+ TSM-DE21 570W",price:"3,380,000đ",image:"/images/product-3.jpg",specs:["570W","Multi-busbar","22.1% Efficiency","Low Temperature"],category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:3380000},
{id:21,name:"Tấm Pin JA Solar DeepBlue 4.0X JAM72S30 540W",price:"2,950,000đ",originalPrice:"3,200,000đ",image:"/images/product-3.jpg",specs:["540W","PERC Half-cell","20.9% Efficiency","High Reliability"],discount:8,category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:2950000},
{id:22,name:"Tấm Pin Risen Energy Titan RSM150-8-535M",price:"2,850,000đ",image:"/images/product-3.jpg",specs:["535W","Mono PERC","20.7% Efficiency","PID Resistant"],category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:2850000},
{id:23,name:"Tấm Pin Hanwha Q CELLS Q.PEAK DUO L-G10.2 540W",price:"3,680,000đ",originalPrice:"3,950,000đ",image:"/images/product-3.jpg",specs:["540W","Q.ANTUM DUO","20.9% Efficiency","Hot-Spot Protect"],discount:7,category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:3680000},
{id:24,name:"Tấm Pin First Solar Series 6 Plus 445W",price:"4,200,000đ",image:"/images/product-3.jpg",specs:["445W","CdTe Thin Film","19.5% Efficiency","Superior Performance"],category:"Tấm Pin Năng Lượng Mặt Trời Solar",priceNumber:4200000},
{id:25,name:"Luxpower SNA 5000 Hybrid Inverter",price:"15,800,000đ",originalPrice:"17,200,000đ",image:"/images/product-4.jpg",specs:["5kW","Hybrid MPPT","Battery Ready","Grid-Tie"],discount:8,category:"Inverter Luxpower",priceNumber:15800000},
{id:26,name:"Luxpower LXP 3600 ACS Inverter",price:"12,500,000đ",image:"/images/product-4.jpg",specs:["3.6kW","AC Coupled","Smart Load","WiFi Monitor"],category:"Inverter Luxpower",priceNumber:12500000},
{id:27,name:"Luxpower SNA 8000 Three Phase",price:"28,900,000đ",originalPrice:"31,500,000đ",image:"/images/product-4.jpg",specs:["8kW","3-Phase","Commercial Grade","High Efficiency"],discount:8,category:"Inverter Luxpower",priceNumber:28900000},
{id:28,name:"Luxpower LXP 6000 ACS",price:"18,200,000đ",image:"/images/product-4.jpg",specs:["6kW","Pure Sine Wave","UPS Function","Remote Monitor"],category:"Inverter Luxpower",priceNumber:18200000},
{id:29,name:"Luxpower SNA 10K Hybrid",price:"32,800,000đ",originalPrice:"35,500,000đ",image:"/images/product-4.jpg",specs:["10kW","Dual MPPT","Battery Management","Grid Support"],discount:8,category:"Inverter Luxpower",priceNumber:32800000},
{id:30,name:"Luxpower LXP 12K ACS Pro",price:"45,600,000đ",image:"/images/product-4.jpg",specs:["12kW","Professional","Smart Grid","Advanced Protection"],category:"Inverter Luxpower",priceNumber:45600000},
{id:31,name:"Luxpower SNA 15K Commercial",price:"58,900,000đ",originalPrice:"63,500,000đ",image:"/images/product-4.jpg",specs:["15kW","Commercial Use","High Power","Scalable System"],discount:7,category:"Inverter Luxpower",priceNumber:58900000},
{id:32,name:"Luxpower LXP 20K Enterprise",price:"78,500,000đ",image:"/images/product-4.jpg",specs:["20kW","Enterprise Grade","Multi-String","Cloud Monitoring"],category:"Inverter Luxpower",priceNumber:78500000},
];

const categoryOptions = [
  ["inverter","Biến tần hòa lưới","Biến Tần Inverter"],
  ["battery","Pin lưu trữ","Pin Lưu Trữ Lithium"],
  ["panel","Tấm pin","Tấm Pin Năng Lượng Mặt Trời Solar"],
  ["hybrid","Inverter hybrid","Inverter Luxpower"],
] as const;

const brandNames = ["Growatt","Huawei","SolarEdge","Fronius","ABB","Sungrow","SMA","GoodWe","Pylontech","BYD","Tesla","LG","Sonnen","Alpha ESS","Canadian Solar","JinkoSolar","Longi","Trina Solar","JA Solar","Risen Energy","Hanwha","First Solar","Luxpower"];

function getBrand(name:string) {
  return brandNames.find((brand)=>name.toLowerCase().includes(brand.toLowerCase())) || "Khác";
}
function getPower(product:Product) {
  const source = [product.name, ...product.specs].join(" ");
  const kw = source.match(/(\d+(?:\.\d+)?)\s*kW/i);
  if (kw) return Number(kw[1]);
  const watts = source.match(/(\d+(?:\.\d+)?)\s*W/i);
  return watts ? Number(watts[1]) / 1000 : 0;
}
function money(value:number) { return new Intl.NumberFormat("vi-VN").format(value); }

export default function AllProductsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen,setDrawerOpen] = useState(false);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const power = params.get("power") || "";
  const minPrice = Number(params.get("minPrice") || 0);
  const maxPrice = Number(params.get("maxPrice") || 200000000);
  const sort = params.get("sort") || "popular";
  const page = Math.max(1, Number(params.get("page") || 1));
  const pageSize = 12;

  const setQuery = (patch:Record<string,string | number | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key,value]) => {
      if (value === null || value === "" || value === 0 && (key === "minPrice")) next.delete(key);
      else next.set(key,String(value));
    });
    if (!("page" in patch)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}`,{scroll:false});
  };
  const clearAll = () => router.replace(pathname,{scroll:false});

  const filtered = useMemo(() => {
    const categoryValue = categoryOptions.find(([id])=>id===category)?.[2];
    let result = products.filter((product) => {
      const matchesQ = !q || [product.name,...product.specs].join(" ").toLowerCase().includes(q.toLowerCase());
      const matchesCategory = !categoryValue || product.category === categoryValue;
      const matchesBrand = !brand || getBrand(product.name) === brand;
      const productPower = getPower(product);
      const matchesPower = !power || (
        power === "lt5" ? productPower < 5 :
        power === "5to10" ? productPower >= 5 && productPower <= 10 :
        productPower > 10
      );
      return matchesQ && matchesCategory && matchesBrand && matchesPower && product.priceNumber >= minPrice && product.priceNumber <= maxPrice;
    });
    if (sort === "price-asc") result = [...result].sort((a,b)=>a.priceNumber-b.priceNumber);
    if (sort === "price-desc") result = [...result].sort((a,b)=>b.priceNumber-a.priceNumber);
    if (sort === "name") result = [...result].sort((a,b)=>a.name.localeCompare(b.name,"vi"));
    return result;
  },[q,category,brand,power,minPrice,maxPrice,sort]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize));
  const safePage = Math.min(page,totalPages);
  const shown = filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  const brands = useMemo(()=>Array.from(new Set(products.map((p)=>getBrand(p.name)))).sort(),[]);

  const chips = [
    q && ["q",`Tìm: “${q}”`],
    category && ["category",categoryOptions.find(([id])=>id===category)?.[1] || category],
    brand && ["brand",brand],
    power && ["power",power==="lt5"?"< 5 kW":power==="5to10"?"5–10 kW":"> 10 kW"],
    minPrice > 0 && ["minPrice",`Từ ${money(minPrice)}đ`],
    maxPrice < 200000000 && ["maxPrice",`Đến ${money(maxPrice)}đ`],
  ].filter(Boolean) as string[][];

  const FilterPanel = () => (
    <div className="space-y-7">
      <div><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Danh mục</div><div className="mt-3 space-y-1">{categoryOptions.map(([id,label])=><button key={id} type="button" onClick={()=>setQuery({category:category===id?null:id})} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold ${category===id?"bg-[#12372A] text-white":"text-slate-600 hover:bg-emerald-50"}`}>{label}</button>)}</div></div>
      <div><label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Thương hiệu</label><select value={brand} onChange={(e)=>setQuery({brand:e.target.value||null})} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#1B5E45]"><option value="">Tất cả thương hiệu</option>{brands.map((b)=><option key={b}>{b}</option>)}</select></div>
      <div><div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Khoảng công suất</div><div className="mt-3 grid gap-2">{[["lt5","Dưới 5 kW"],["5to10","5–10 kW"],["gt10","Trên 10 kW"]].map(([value,label])=><button key={value} type="button" onClick={()=>setQuery({power:power===value?null:value})} className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold ${power===value?"border-[#12372A] bg-[#eef4ef] text-[#12372A]":"border-slate-200 text-slate-600"}`}>{label}</button>)}</div></div>
      <div><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Khoảng giá</span><span className="text-xs font-bold text-[#1B5E45]">{Math.round(minPrice/1000000)}–{Math.round(maxPrice/1000000)} triệu</span></div><div className="mt-4 space-y-4"><label className="block text-xs text-slate-500">Giá tối thiểu<input type="range" min="0" max="200000000" step="5000000" value={minPrice} onChange={(e)=>setQuery({minPrice:Number(e.target.value)})} className="mt-2 w-full accent-[#12372A]" /></label><label className="block text-xs text-slate-500">Giá tối đa<input type="range" min="0" max="200000000" step="5000000" value={maxPrice} onChange={(e)=>setQuery({maxPrice:Number(e.target.value)})} className="mt-2 w-full accent-[#12372A]" /></label></div></div>
      <button type="button" onClick={clearAll} className="w-full rounded-xl border border-emerald-950/15 px-4 py-3 text-sm font-black text-[#12372A]">Xóa toàn bộ bộ lọc</button>
    </div>
  );

  return (
    <section className="bg-[#f7f9f6] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.18em] text-[#1B5E45]">Catalog thiết bị</div><h2 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#10271f]">Tìm đúng thiết bị cho cấu hình của bạn</h2></div>
          <div className="flex gap-2"><button type="button" onClick={()=>setDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-950/15 bg-white px-4 py-3 text-sm font-black text-[#12372A] lg:hidden"><AdjustmentsHorizontalIcon className="h-5 w-5" /> Bộ lọc</button><select value={sort} onChange={(e)=>setQuery({sort:e.target.value})} className="rounded-xl border border-emerald-950/15 bg-white px-4 py-3 text-sm font-bold outline-none"><option value="popular">Phổ biến</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option><option value="name">Tên A → Z</option></select></div>
        </div>

        <div className="relative mt-8"><MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e)=>setQuery({q:e.target.value||null})} placeholder="Tìm theo tên, công suất, công nghệ..." className="w-full rounded-xl border border-emerald-950/10 bg-white py-4 pl-12 pr-4 outline-none focus:border-[#1B5E45]" /></div>

        {chips.length>0 && <div className="mt-4 flex flex-wrap items-center gap-2">{chips.map(([key,label])=><button key={key} type="button" onClick={()=>setQuery({[key]:null})} className="inline-flex items-center gap-2 rounded-full bg-[#e7efe9] px-3 py-2 text-xs font-bold text-[#12372A]">{label}<XMarkIcon className="h-4 w-4" /></button>)}<button type="button" onClick={clearAll} className="text-xs font-black text-slate-500 underline">Xóa tất cả</button></div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden border-r border-emerald-950/10 pr-7 lg:block"><FilterPanel /></aside>
          <div>
            <div className="mb-5 flex items-center justify-between text-sm text-slate-500"><span><strong className="text-[#12372A]">{filtered.length}</strong> sản phẩm phù hợp</span><span>Trang {safePage}/{totalPages}</span></div>
            {shown.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((p)=><Link key={p.id} href={`/product/${p.id}`} className="group flex h-full flex-col overflow-hidden border border-emerald-950/10 bg-white transition hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-[0_16px_40px_rgba(18,55,42,.09)]"><div className="relative aspect-[4/3] overflow-hidden bg-[#eef4ef]"><Image src={p.image} alt={p.name} fill className="object-cover transition duration-500 group-hover:scale-105" />{p.discount&&<span className="absolute left-4 top-4 rounded-md bg-[#C9E265] px-2.5 py-1 text-xs font-black text-[#12372A]">-{p.discount}%</span>}<span className="absolute right-4 top-4 rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-600">{getBrand(p.name)}</span></div><div className="flex flex-1 flex-col p-5"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{p.category}</div><h3 className="mt-2 text-lg font-black leading-snug text-[#10271f]">{p.name}</h3><div className="mt-4 flex flex-wrap gap-2">{p.specs.slice(0,3).map((spec)=><span key={spec} className="rounded-md bg-[#f4f7f3] px-2 py-1 text-xs font-semibold text-slate-600">{spec}</span>)}</div><div className="mt-auto flex items-end justify-between border-t border-emerald-950/10 pt-5"><div><div className="text-xl font-black text-[#1B5E45]">{p.price}</div>{p.originalPrice&&<div className="text-xs text-slate-400 line-through">{p.originalPrice}</div>}</div><span className="text-sm font-black text-[#12372A]">Chi tiết →</span></div></div></Link>)}</div>:
            <div className="border border-dashed border-emerald-950/20 bg-white px-6 py-16 text-center"><div className="text-xl font-black text-[#12372A]">Không có sản phẩm phù hợp</div><p className="mt-2 text-slate-500">Thử bỏ bớt một bộ lọc hoặc mở rộng khoảng giá.</p><button onClick={clearAll} className="mt-5 rounded-xl bg-[#12372A] px-5 py-3 text-sm font-black text-white">Xóa bộ lọc</button></div>}

            {totalPages>1 && <div className="mt-10 flex items-center justify-center gap-2"><button disabled={safePage<=1} onClick={()=>setQuery({page:safePage-1})} className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-950/10 bg-white disabled:opacity-30"><ChevronLeftIcon className="h-5 w-5" /></button>{Array.from({length:totalPages},(_,i)=>i+1).map((n)=><button key={n} onClick={()=>setQuery({page:n})} className={`h-11 min-w-11 rounded-xl px-3 text-sm font-black ${safePage===n?"bg-[#12372A] text-white":"border border-emerald-950/10 bg-white text-slate-600"}`}>{n}</button>)}<button disabled={safePage>=totalPages} onClick={()=>setQuery({page:safePage+1})} className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-950/10 bg-white disabled:opacity-30"><ChevronRightIcon className="h-5 w-5" /></button></div>}
          </div>
        </div>
      </div>

      {drawerOpen && <div className="fixed inset-0 z-[70] lg:hidden"><button className="absolute inset-0 bg-black/40" aria-label="Đóng bộ lọc" onClick={()=>setDrawerOpen(false)} /><div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Catalog</div><h3 className="text-xl font-black text-[#12372A]">Bộ lọc sản phẩm</h3></div><button onClick={()=>setDrawerOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div><FilterPanel /><button onClick={()=>setDrawerOpen(false)} className="mt-6 w-full rounded-xl bg-[#12372A] px-5 py-4 font-black text-white">Xem {filtered.length} sản phẩm</button></div></div>}
    </section>
  );
}
