import { NextResponse } from "next/server";
import { SEGMENT_IDS } from "@/content/site";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 12000)
      return NextResponse.json({ ok: false }, { status: 413 });
    const p = JSON.parse(raw);
    const text = (key: string, max: number) =>
      typeof p[key] === "string" ? p[key].trim().slice(0, max) : "";
    const name = text("name", 120),
      phone = text("phone", 20),
      segment = text("segment", 20),
      email = text("email", 200);
    if (
      name.length < 2 ||
      !/^[+0-9() .\-]{9,20}$/.test(phone) ||
      phone.replace(/\D/g, "").length < 9 ||
      p.consent !== true ||
      (segment && !SEGMENT_IDS.some((s) => s === segment)) ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
      return NextResponse.json({ ok: false }, { status: 400 });
    const payload = {
      name,
      phone,
      segment,
      email,
      company: text("company", 200),
      message: text("message", 4000),
      consent: true,
      submittedAt: new Date().toISOString(),
    };
    const webhook = process.env.LEAD_WEBHOOK_URL;
    if (!webhook) return NextResponse.json({ ok: true, mode: "demo" });
    const url = new URL(webhook);
    if (url.protocol !== "https:")
      return NextResponse.json({ ok: false }, { status: 503 });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.LEAD_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json(
      res.ok ? { ok: true, mode: "webhook" } : { ok: false },
      { status: res.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
