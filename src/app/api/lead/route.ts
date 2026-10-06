import { NextResponse } from "next/server";
import { dispatchLead, type Lead } from "@/lib/leads";
import { LEAD_SOURCES, type LeadSource } from "@/lib/leads/types";
import { isVnMobile, normalizeVnPhone } from "@/lib/phone";

const str = (value: unknown, max = 300) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function cleanEstimate(value: unknown): Lead["estimate"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
    .slice(0, 30)
    .map(([k, v]) => [k.slice(0, 60), typeof v === "string" ? v.slice(0, 200) : v]);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function cleanItems(value: unknown): Lead["items"] {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .slice(0, 50)
    .map((i) => ({ sku: str(i.sku, 80), name: str(i.name, 160), qty: Math.min(999, Math.max(1, Math.floor(Number(i.qty) || 1))) }))
    .filter((i) => i.sku && i.name);
  return items.length ? items : undefined;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 }); }

  // Honeypot: người thật không thấy ô "website" → có giá trị là bot. Trả "thành công" để bot không thử lại.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const phone = normalizeVnPhone(str(body.phone, 30));
  const name = str(body.name, 120);
  if (!name) return NextResponse.json({ ok: false, message: "Vui lòng nhập họ tên" }, { status: 400 });
  if (!isVnMobile(phone)) return NextResponse.json({ ok: false, message: "Số điện thoại di động không hợp lệ" }, { status: 400 });

  const source = str(body.source, 30) as LeadSource;
  const lead: Lead = {
    name, phone,
    zalo: str(body.zalo, 30) || undefined,
    address: str(body.address) || undefined,
    message: str(body.message, 2000) || undefined,
    source: LEAD_SOURCES.includes(source) ? source : "contact",
    segment: str(body.segment, 60) || undefined,
    estimate: cleanEstimate(body.estimate),
    items: cleanItems(body.items),
    page: str(body.page, 200) || undefined,
    submittedAt: new Date().toISOString(),
  };

  try {
    const result = await dispatchLead(lead);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, message: "Chưa gửi được thông tin, vui lòng thử lại hoặc gọi hotline" }, { status: 502 });
  }
}
