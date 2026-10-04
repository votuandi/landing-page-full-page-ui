import type { ReactNode } from "react";
export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  tone = "light",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "light" | "soft" | "dark";
}) {
  return (
    <section id={id} className={`template-section section-${tone}`}>
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
