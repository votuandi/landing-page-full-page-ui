import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  if (!payload?.phone) return NextResponse.json({ ok:false, message:"Thiếu số điện thoại" }, { status:400 });

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ ok:true, mode:"demo" });
  }

  const response = await fetch(webhook, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(process.env.LEAD_WEBHOOK_TOKEN ? { Authorization:`Bearer ${process.env.LEAD_WEBHOOK_TOKEN}` } : {})
    },
    body: JSON.stringify({ ...payload, submittedAt:new Date().toISOString() }),
    cache:"no-store",
  });

  if (!response.ok) return NextResponse.json({ ok:false }, { status:502 });
  return NextResponse.json({ ok:true, mode:"webhook" });
}