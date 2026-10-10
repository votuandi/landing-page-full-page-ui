import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { normalizeVnPhone, prefillToSearch, CALCULATOR_ID } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { BrandMark } from "../shared/BrandMark";
import { toClientLink } from "../shared/links";
import { mediaSrc } from "../shared/media";
import type { siteHeader } from "./schema";
import Header from "./t15.client";

/** Header t15: dải cam kết (server, CSS marquee) + header có mega menu, hotline, menu mobile (island). */
export default function SiteHeaderT15({ data, site, sectionId }: SectionPropsOf<typeof siteHeader>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const link = (value: Parameters<typeof toClientLink>[0]) => toClientLink(value, site.locale);
  const pricing = data.pricingMenu;
  const topBar = data.topBar.map(t);

  const group = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={`flex shrink-0 items-center gap-10 pr-10 ${hidden ? "t15-marquee-dup" : ""}`}>
      {topBar.map((item, i) => (
        <li key={i} className="flex items-center gap-2 whitespace-nowrap"><CheckBadgeIcon aria-hidden className="h-4 w-4 text-accent" />{item}</li>
      ))}
    </ul>
  );

  return (
    <>
      {topBar.length > 0 && (
        <div className="relative z-[55] bg-primary text-xs font-bold text-on-primary">
          <div className="t15-marquee t15-no-scrollbar py-2" role="region" aria-label={site.locale === "en" ? "Our commitments" : "Cam kết của chúng tôi"}>
            <div className="t15-marquee-track flex w-max">{group(false)}{group(true)}</div>
          </div>
        </div>
      )}
      <Header
        sectionId={sectionId}
        locale={site.locale}
        brand={<BrandMark name={data.brand.name} logoSrc={mediaSrc(data.brand.logo)} />}
        brandName={data.brand.name}
        pricing={pricing && {
          label: t(pricing.label),
          hint: t(pricing.hint),
          categories: pricing.categories.map((cat) => ({
            id: cat.id, label: t(cat.label), hint: t(cat.hint),
            groups: cat.groups.map((g) => ({
              title: g.title && t(g.title),
              chips: g.chips.map((chip) => {
                // Nhu cầu gửi kèm lead luôn bằng tiếng Việt.
                const topic = [cat.label.vi, g.title?.vi, chip.label.vi].filter(Boolean).join(" · ");
                const calculator = { segment: cat.segment, bill: chip.bill, topic };
                return {
                  popular: chip.popular,
                  link: { label: t(chip.label), href: `/?${prefillToSearch(calculator)}#${CALCULATOR_ID}`, external: false, calculator },
                };
              }),
            })),
          })),
        }}
        menus={data.menus.map((menu) => ({
          label: t(menu.label),
          columns: menu.columns.map((col) => ({
            title: t(col.title), description: col.description && t(col.description),
            link: col.link && link(col.link), links: col.links.map(link),
          })),
        }))}
        links={data.links.map(link)}
        mobileLinks={data.mobileLinks.map(link)}
        hotlineLabel={t(data.hotlineLabel)}
        hotlines={data.hotlines.map((h) => ({
          name: h.name,
          main: { phone: h.main, href: `tel:${normalizeVnPhone(h.main)}` },
          lines: h.lines.map((line) => ({ label: t(line.label), phone: line.phone, href: `tel:${normalizeVnPhone(line.phone)}` })),
          mapLink: h.mapLink && link(h.mapLink),
        }))}
        cta={link(data.cta)}
        drawerActions={data.drawerActions.map(link)}
      />
    </>
  );
}
