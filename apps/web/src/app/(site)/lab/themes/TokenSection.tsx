export default function TokenSection({ id, title, note, children }: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="space-y-5 border-t border-line/10 pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`${id}-title`} className="text-display-xs font-black tracking-tight text-fg">{title}</h2>
        {note && <p className="text-sm text-fg-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}
