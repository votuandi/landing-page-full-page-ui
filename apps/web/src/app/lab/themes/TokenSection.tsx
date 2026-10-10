export default function TokenSection({ id, title, children }: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="space-y-4">
      <h2 id={`${id}-title`} className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
