import type { ReactNode } from "react";

/** Tiêu đề section theo design system template-12 (eyebrow + heading + mô tả). */
export function SectionHead({ id, eyebrow, title, desc, action, center = false }: {
  id?: string; eyebrow: string; title: string; desc?: string; action?: ReactNode; center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-5 ${center ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div data-reveal="down" className={center ? "max-w-3xl" : "max-w-3xl"}>
        <span className="t15-eyebrow">{eyebrow}</span>
        <h2 id={id} className={`t15-heading ${center ? "mx-auto" : ""}`}>{title}</h2>
        {desc && <p className={`t15-subheading ${center ? "mx-auto" : ""}`}>{desc}</p>}
      </div>
      {action && <div data-reveal="up" className="min-w-0 lg:max-w-[55%]">{action}</div>}
    </div>
  );
}

