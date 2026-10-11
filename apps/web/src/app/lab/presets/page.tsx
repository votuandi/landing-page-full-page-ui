import Link from "next/link";
import { presets } from "@solar/presets";

export default function PresetsLabPage() {
  return <main className="t15-container py-12">
    <h1 className="t15-heading">Lab · Preset</h1>
    <ul className="mt-8 grid gap-5 md:grid-cols-3">
      {presets.map((preset) => <li key={preset.id} className="t15-card p-6">
        <Link href={`/lab/presets/${preset.id}`} className="text-lg font-black text-primary">{preset.name}</Link>
        <p className="mt-2 text-fg-muted">{preset.description}</p>
        <p className="mt-3 text-sm text-fg-subtle">{preset.group} · {preset.themeId}</p>
        {preset.subpages?.map((slug) => <Link key={slug} href={`/lab/presets/${preset.id}?subpage=${encodeURIComponent(slug)}`} className="mt-3 block text-sm text-primary underline">{slug}</Link>)}
      </li>)}
    </ul>
  </main>;
}
