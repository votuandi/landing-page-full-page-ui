import { NextResponse } from "next/server";
import { dispatchLead } from "@/lib/leads";
import { parseLead, str } from "@/lib/leads/parse";
import { tenantLeadHandler } from "@/lib/tenant/leadIntake";

export async function POST(request: Request) {
  if (request.headers.has("x-tenant-id") || request.headers.has("x-site-id")) return tenantLeadHandler(request);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Dữ liệu không hợp lệ" }, { status: 400 }); }

  // Honeypot: người thật không thấy ô "website" → có giá trị là bot. Trả "thành công" để bot không thử lại.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const parsed = parseLead(body);
  if ("error" in parsed) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });

  try {
    const result = await dispatchLead(parsed.lead);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: false, message: "Chưa gửi được thông tin, vui lòng thử lại hoặc gọi hotline" }, { status: 502 });
  }
}
