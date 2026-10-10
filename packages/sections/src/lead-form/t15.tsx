import Image from "next/image";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { MediaImage, delay } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { leadForm } from "./schema";
import LeadForm from "./t15.client";

/** Form "Nhận báo giá" t15: ảnh + cam kết bên trái, thẻ form bên phải. */
export default function LeadFormT15({ data, site, sectionId }: SectionPropsOf<typeof leadForm>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  const src = mediaSrc(data.image);
  return (
    <section aria-labelledby={titleId} className="t15-invert t15-ocean relative overflow-hidden text-fg">
      <div className="grid lg:grid-cols-2">
        <div data-reveal="left" className="relative min-h-[52vh] overflow-hidden lg:min-h-[640px]">
          {src
            ? <Image src={src} alt={t(data.image.alt)} fill loading="lazy" className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            : <MediaImage alt={t(data.image.alt)} sizes="50vw" />}
          <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/50 to-scrim/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-on-media sm:p-10 xl:p-16">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent"><ShieldCheckIcon aria-hidden className="h-7 w-7" /></div>
            <h2 id={titleId} className="mt-6 max-w-lg text-4xl font-black tracking-[-.04em] sm:text-5xl">{t(data.title)}</h2>
            {data.points.length > 0 && (
              <ul className="mt-6 grid gap-2.5">
                {data.points.map((point, i) => <li key={i} className="flex items-center gap-2 font-semibold"><CheckCircleIcon aria-hidden className="h-5 w-5 shrink-0 text-accent" />{t(point)}</li>)}
              </ul>
            )}
          </div>
        </div>
        <div className="flex items-center px-4 py-14 sm:px-10 xl:px-20">
          <div data-reveal="right" style={delay(0.15)} className="t15-card w-full max-w-[620px] p-6 text-fg shadow-2xl md:p-8">
            <h3 className="mb-5 text-lg font-black text-fg">{t(data.formTitle)}</h3>
            <LeadForm locale={site.locale} source={data.source} fields={data.fields} text={{
              submit: t(data.submitLabel),
              success: t(data.successText),
              privacy: t(data.privacyNote),
              messageLabel: data.messageLabel && t(data.messageLabel),
              fallbackPhone: data.fallbackPhone,
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}
