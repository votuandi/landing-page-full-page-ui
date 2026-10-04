# Minwy Solar — Template 2

A reusable Vietnamese solar website built with Next.js 15, React 19, TypeScript, and Tailwind CSS. This branch starts from `master` and replaces the previous homepage with a split hero, solution cards, equipment highlights, a process section, native FAQ disclosures, and a contact banner.

## Run and verify

Use Node.js 20+ and the committed npm lockfile.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` to the site's actual public origin **before building**. Canonicals, social URLs, organization structured data, robots, and sitemap use this setting. The development fallback is `http://localhost:3000`; it is not a production domain.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
# In another terminal, against the running production server:
npm run test:smoke
```

Set `SMOKE_URL` if testing a different host or port. The smoke check visits every sitemap entry, validates canonical paths and contact links, checks SEO assets, and verifies invalid detail pages return 404.

## Reuse the template

| Change | Location |
| --- | --- |
| Company name, phone, email, address, navigation | `src/utils/constants.ts` |
| Hero copy, solutions, process, questions | `src/data/home.ts` |
| Product catalog and detail information | `src/data/products.ts` |
| Articles and article content | `src/data/news.ts` |
| Service catalog | `SERVICES` in `src/utils/constants.ts` |
| Brand colors, spacing, responsive layout | Template 2 tokens and styles in `src/app/globals.css`; `tailwind.config.ts` |
| Shared brand, sections, image fallback | `src/components/template/` |
| Page and social metadata | `src/utils/seo.ts` and individual route files |
| Brand icon | `public/icon.svg`, `public/favicon.ico`, `public/apple-icon.png` |

The homepage is a server component. Only interactive navigation, filters, forms, detail tabs, and scroll effects need client JavaScript. Images use Next Image, responsive sizes, AVIF/WebP output, and lazy loading; the hero image has priority. The homepage no longer downloads or autoplays the 37 MB background video. Product, service, and news detail routes are prerendered from their shared catalogs.

Navigation has an active state, an accessible mobile toggle, Escape dismissal, and a skip link. FAQs use native `details` elements. Content remains visible without JavaScript and scroll effects honor reduced motion.

## Integration boundaries

This is a frontend template, without a cart, payment, lead-storage, or warranty backend. Contact and quote actions compose an email or open a telephone link. Email drafts must be sent in the user's email application. Warranty registration composes a request; lookup asks the visitor to contact the company and does not manufacture a warranty result.

Existing product prices/specifications, reviews/sales counts, company milestones, example projects, and article content were carried forward from the base branch. Review and replace that sample content with verified business data before publishing. No current market, policy, or warranty claims were independently verified in this refactor.

See `CODEBASE_REVIEW.md` for the review and changes.
