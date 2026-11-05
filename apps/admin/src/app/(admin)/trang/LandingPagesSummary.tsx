"use client";
import Link from "next/link";
import { useState } from "react";
import { UpgradeRequest } from "../../../components/UpgradeRequest.tsx";

const action = "inline-flex min-h-11 items-center rounded-button px-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export function LandingPagesSummary({ count, limit, reason, upgrade }: { count: number; limit: number; reason?: string; upgrade: boolean }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  return <section aria-labelledby="landing-pages" className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-card border border-line/20 bg-bg-elevated p-4">
    <div className="min-w-0 flex-1 basis-60 space-y-1">
      <h2 id="landing-pages" className="text-lg font-semibold text-fg">Landing page</h2>
      <p className="text-sm tabular-nums text-fg-muted">Đã dùng {count}/{Number.isFinite(limit) ? limit : "không giới hạn"} trang (gồm trang chủ)</p>
      {reason && <p className="text-sm text-fg-muted">{reason}</p>}
    </div>
    <div className="flex flex-wrap gap-2">
      {!reason && <Link href="/trang/moi" className={`${action} bg-primary text-on-primary`}>Tạo landing page</Link>}
      {upgrade && <button type="button" className={`${action} border border-primary/40 text-primary hover:bg-bg-tint`} onClick={() => setShowUpgrade(true)}>Nâng cấp gói</button>}
    </div>
    {showUpgrade && <UpgradeRequest feature="landingPages" onClose={() => setShowUpgrade(false)} />}
  </section>;
}
