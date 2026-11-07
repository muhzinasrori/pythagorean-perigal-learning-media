# SEO Optimization Changelog

Complete technical-SEO layer added on 2026-11-07 so the site is ready for
Google Search Console registration and rich results. Build verified with
Next.js 16.1.3 (all SEO routes compile as static prerendered pages).

## ✅ New files

| File | Purpose |
|---|---|
| `src/lib/seo.ts` | Single source of truth: site URL, title, description, keywords, FAQ items, JSON-LD builder |
| `src/app/robots.ts` | Dynamic `/robots.txt` — allows all, blocks `/api/` + `/teacher`, links sitemap |
| `src/app/sitemap.ts` | Dynamic `/sitemap.xml` |
| `src/app/manifest.ts` | PWA manifest `/manifest.webmanifest` (theme #0f766e, icon set) |
| `src/app/opengraph-image.tsx` | 1200×630 OG image generated at build time (title, equation chips, 3-4-5 diagram) |
| `src/app/twitter-image.tsx` | Twitter card image (re-uses the OG image) |
| `src/app/icon.svg` | Custom Pythagoras favicon: 3-4-5 triangle with color-coded squares |
| `src/components/seo/JsonLd.tsx` | Renders schema.org JSON-LD `<script>` safely |
| `src/components/seo/GoogleAnalytics.tsx` | GA4 via next/script — active only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set |
| `src/lib/analytics.ts` | `trackEvent()` helper (safe no-op without GA) |
| `src/app/apple-icon.png`, `src/app/favicon.ico`, `public/icons/icon-192.png`, `public/icons/icon-512.png` | Generated icon set (run `bun scripts/generate-icons.mjs` after editing `icon.svg`) |
| `scripts/generate-icons.mjs` | Icon generator (sharp): 192/512 PNG + apple-icon + 32px favicon source |

## ✏️ Modified files

| File | Change |
|---|---|
| `src/app/layout.tsx` | Full metadata: `metadataBase`, title template, canonical, Open Graph, Twitter Card, robots (`max-image-preview:large`), apple-web-app, GSC verification hook; **fixed typo "Learnign" → "Learning"**; mounts JsonLd + GoogleAnalytics |
| `src/features/landing/LandingView.tsx` | New crawlable **FAQ accordion** (6 Q&A) — content identical to FAQPage JSON-LD |
| `src/features/shell/LearningApp.tsx` | All navigation goes through `changeView()` which fires a GA4 `module_view` event |
| `src/app/teacher/page.tsx` | Added metadata: `noindex, nofollow` (private dashboard stays out of Google) |
| `next.config.ts` | `poweredByHeader: false` (hides X-Powered-By), `compress: true` |
| `.env.example` | Added `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GSC_VERIFICATION`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` + fixed invalid inline comments |
| `README.md` | New "SEO & Google Search Console" section with step-by-step GSC registration guide |

## 🗑️ Removed

- `public/robots.txt` — replaced by the dynamic `src/app/robots.ts` route
  (the static file would conflict with the App Router convention).

## ⚙️ Environment variables (all optional)

```env
# Canonical production URL (defaults to the Vercel URL; change for custom domain)
NEXT_PUBLIC_SITE_URL="https://pythagorean-perigal-learning-media.vercel.app"
# Google Search Console verification token (HTML tag method)
NEXT_PUBLIC_GSC_VERIFICATION=""
# Google Analytics 4 measurement ID (G-XXXXXXXXXX)
NEXT_PUBLIC_GA_MEASUREMENT_ID=""
```

## 🧪 Verification results (production build, standalone server)

- `/robots.txt` → `Allow: /`, `Disallow: /api/, /teacher`, `Sitemap:` ✓
- `/sitemap.xml` → canonical home URL with `lastmod` ✓
- `/manifest.webmanifest` → name, theme_color, 3 icons ✓
- Head: title (56 chars), description (158 chars), canonical, 8× OG tags,
  7× Twitter tags, robots + googlebot, manifest + 3 icon links ✓
- JSON-LD: valid `@graph` → WebApplication + LearningResource, Person, FAQPage (6 Q) ✓
- FAQ text present in server-rendered HTML (crawlable without JS) ✓
- `/teacher` → `noindex, nofollow, nocache` ✓
- `X-Powered-By` header removed ✓
- `/opengraph-image` & `/twitter-image` → 200, image/png, 1200×630 ✓
