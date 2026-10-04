# Codebase review — Template 2

Base: `master` at `dc1e7c5129a80729f3255af39dd21cbdd486b869`.

| Finding | Change |
| --- | --- |
| Product listing had 32 entries, but the detail route supported only 4. News detail supported 6 of the listing's 10 articles. | Shared catalogs power listing/detail routes and static params. Existing extended detail content is retained; all catalog IDs resolve. |
| Brand and contact details were repeated; footer formatting differed from configuration. | Shared site configuration drives header, footer, contact form, quote/service actions, and structured data. Brand wording throughout the source is Minwy Solar. |
| Navigation and sitemap included nonexistent routes; every page inherited the home canonical. | Navigation points to real routes. Each page has its own canonical and social metadata. Sitemap includes all 56 supported pages. |
| Layout advertised missing OG and icon files and a placeholder verification token. | Metadata uses an existing image; SVG favicon, ICO fallback, and Apple icon exist. The placeholder verification token is removed. |
| Homepage used multiple client sections, timers, and a large video background. | Server-rendered modular homepage with a priority hero image, lazy secondary images, and no automatic video request. Retired homepage components and unused animation abstractions are removed. |
| Raw image elements and unstable project memo dependencies triggered lint warnings. | Shared Next Image fallback component; project data lives outside render; sorting copies the array instead of mutating it. Strict lint has zero warnings. |
| Animation observers were recreated when trigger state changed; delayed callbacks were not cleaned up; SSR content started hidden. | A single observer lifecycle per wrapper, cleanup with disconnect, reduced-motion support, and visible pre-hydration content. |
| Buttons had no action, and forms reported success without submitting anything. | Quote/contact/service buttons now use email, telephone, or the contact route. Warranty/contact flows make their email/manual integration behavior explicit. |
| Styling and content were entangled, with repeated catalog definitions. | Template sections and branding components, shared typed catalogs, editable homepage content, CSS tokens, and deployment URL configuration are documented. |

## Validation

- Unit tests cover identity/contact configuration, navigation route existence, catalog ID uniqueness and asset existence, canonical/social metadata, sitemap completeness, deployment URL behavior, and safe JSON-LD serialization.
- Production smoke checks exercise all sitemap pages, contact links, canonical URLs, icons/robots, and invalid detail 404s.
- ESLint runs with `--max-warnings=0`; TypeScript and production build are required checks.

## Results

- Strict ESLint: passed, zero warnings.
- TypeScript: passed.
- Unit tests: 7/7 passed.
- Production build: passed; homepage is static, with a 174-byte route bundle and 108 kB first-load JS reported by Next.js.
- Production HTTP smoke: all 56 sitemap routes passed, with route-specific canonicals, updated contact links, valid SEO assets, and 404s for invalid details.
- Chromium UI checks: passed at 1440, 768, 390, and 360 px widths; verified no horizontal overflow, loaded homepage images, mobile menu navigation/Escape, FAQ disclosure, no page errors, and readable homepage content with JavaScript disabled.
- Desktop and mobile screenshots were visually inspected.

## Remaining limits

Business sample data needs editorial verification. The template has no persistence, payment, cart, or warranty database. Existing Next.js/React dependency versions were retained; dependency/security updates should be validated separately rather than implied by this refactor. No measured Core Web Vitals improvement is claimed without deployed traffic or a Lighthouse measurement.
