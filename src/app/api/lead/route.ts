import { NextResponse } from "next/server";
import { dispatchLead, type Lead } from "@/lib/leads";
import { isVnMobile, normalizeVnPhone } from "@/lib/phone";

const str = (value: unknown, max = 300) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 }); }

  // Honeypot: người thật không thấy ô "website" → có giá trị là bot. Trả "thành công" để bot không thử lại.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const phone = normalizeVnPhone(str(body.phone, 30));
  const name = str(body.name, 120);
  if (!name) return NextResponse.json({ ok: false, message: "Vui lòng nhập họ tên" }, { status: 400 });
  if (!isVnMobile(phone)) return NextResponse.json({ ok: false, message: "Số điện thoại di động không hợp lệ" }, { status: 400 });

  const estimate = body.estimate && typeof body.estimate === "object"
    ? Object.fromEntries(
        Object.entries(body.estimate as Record<string, unknown>)
          .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
          .slice(0, 30)
          .map(([k, v]) => [k.slice(0, 60), typeof v === "string" ? v.slice(0, 200) : v]),
      ) as Lead["estimate"]
    : undefined;

  const lead: Lead = {
    name, phone,
    zalo: str(body.zalo, 30) || undefined,
    address: str(body.address) || undefined,
    email: str(body.email, 120) || undefined,
    message: str(body.message, 2000) || undefined,
    source: str(body.source, 60) || "website",
    segment: str(body.segment, 60) || undefined,
    province: str(body.province, 60) || undefined,
    businessType: str(body.businessType, 80) || undefined,
    estimate,
    submittedAt: new Date().toISOString(),
  };

  try {
    const result = await dispatchLead(lead);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, message: "Chưa gửi được thông tin, vui lòng thử lại hoặc gọi hotline" }, { status: 502 });
  }
}
