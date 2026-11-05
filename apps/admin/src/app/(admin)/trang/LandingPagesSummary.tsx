"use client";
import Link from "next/link";
import { useState } from "react";
import { UpgradeRequest } from "../../../components/UpgradeRequest.tsx";

export function LandingPagesSummary({ count, limit, reason, upgrade }: { count: number; limit: number; reason?: string; upgrade: boolean }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  return <section aria-labelledby="landing-pages" className="space-y-3 rounded-card border border-line/20 bg-bg-elevated p-4">
    <h2 id="landing-pages" className="text-lg font-semibold text-fg">Landing page</h2>
    <p className="text-sm text-fg-muted">Đã dùng {count}/{Number.isFinite(limit) ? limit : "không giới hạn"} trang</p>
    {reason ? <p className="text-sm text-fg-muted">{reason}</p> : <Link href="/trang/moi" className="inline-flex min-h-11 items-center rounded-button border border-primary/40 px-3 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Tạo landing page</Link>}
    {upgrade && <button type="button" className="inline-flex min-h-11 items-center rounded-button border border-primary/40 px-3 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setShowUpgrade(true)}>Nâng cấp gói</button>}
    {showUpgrade && <UpgradeRequest feature="landingPages" onClose={() => setShowUpgrade(false)} />}
  </section>;
}
