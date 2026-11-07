# Pythagoras Lab — Perigal's Dissection 📐

An **interactive, English-medium learning media** for **Grade 8 Mathematics**: students discover
the Pythagorean Theorem (**a² + b² = c²**) by building Henry Perigal's famous *dissection proof*
with their own hands — cut the square on the longer leg, drag the pieces, and watch them fill the
square on the hypotenuse **exactly**.

🔗 **Live Web Application:** [https://pythagorean-perigal-learning-media.vercel.app/](https://pythagorean-perigal-learning-media.vercel.app/)

> Built with the **Guided Discovery Learning** model: *Predict → Construct → Reflect.*

---

## ✨ What's inside

| Module | Core Experience & Pedagogy [1] |
| --- | --- |
| **Landing Page** | Welcome hero featuring an animated 3-4-5 right-triangle diagram and an overview of the guided-discovery path. |
| **Module 1: Areas & Triples** | Live SVG diagram with interactive sliders for legs *a* and *b*. Shows dynamic square area calculations and equations in real-time, complete with preset Pythagorean-triple chips (3-4-5, 5-12-13, etc.). |
| **Module 2: Perigal Studio** | The heart of the lesson. A 4-stage interactive construction studio: <br>• **Step 1:** Draw diagonals to find centre **O** [1].<br>• **Step 2:** Rotate cutting lines with **Magnet Mode** (locks parallel to the hypotenuse) or Free Mode [1].<br>• **Step 3:** CUT NOW — interactive split into 4 congruent pieces [1].<br>• **Step 4:** Drag & drop pieces + *a²* into the *c²* frame with rotation/overlap feedback. |
| **Module 3: Challenge & Quiz** | • **Speed Challenge:** Randomly generated right-triangles where students race the clock to assemble the puzzle. Saves personal best times locally [1].<br>• **Concept Quiz:** 5 formative multiple-choice questions with instant feedback and analytical explanations. |
| **Teacher Dashboard** | A secure data center that gives educators a real-time overview of the classroom's progress, leaderboard standing, and quiz pass rates. |

Every square keeps a **consistent color code** across all modules: a² = amber · b² = teal · c² = rose.

## 🧮 The math engine (verified)

The dissection is computed analytically — no hand-drawn assets:

- Square **b²** is split by two perpendicular lines through its centre, one **parallel to the
  hypotenuse** (Sutherland–Hodgman half-plane clipping) → 4 congruent quadrilaterals with edge
  pattern `(b−a)/2, c/2, c/2, (a+b)/2`.
- Assembly slots inside **c²** are derived in closed form; the central hole is an axis-aligned
  **a × a** square.

`scripts/verify-geometry.ts` proves it for 11 triangles (3-4-5 … 20-21-29, isosceles 5-5, extreme 1-10):

```bash
bun scripts/verify-geometry.ts
# ✅ ALL CHECKS PASSED  (piece ≅ slot within 1e-15, hole = a², slots sum = c²,
#                        wrong-angle cuts provably never tile c²)
```

## 🚀 Run it

**Requirements:** Node.js 18+ (or Bun 1.x)

```bash
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open **http://localhost:3000**.

### Other commands

```bash
npm run lint                 # ESLint
bunx tsc --noEmit            # TypeScript check
bun scripts/verify-geometry.ts  # geometry proof suite
```

## ☁️ Deploy & Database Layer

The app includes an embedded **SQLite database via Prisma ORM** for progress persistence, challenge leaderboard, and quiz records, while remaining 100% functional offline (local storage fallback):

### Database & Environment Setup
Copy `.env.example` to `.env`:
```env
DATABASE_URL="file:../db/custom.db"
TEACHER_ACCESS_CODE="GURU2026"
```

Database commands:
```bash
pnpm run db:push     # Synchronize Prisma schema with local SQLite database
pnpm run db:seed     # Populate demo students, challenge runs, and quiz attempts
pnpm run db:studio   # Open Prisma Studio web inspector
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/students` | Upsert student profile by UUID capability token (`{ token, displayName? }`) |
| `GET` | `/api/progress?token=...` | Retrieve module progress records for a student |
| `PUT` | `/api/progress` | Save/update module progress (`{ token, module, stage, completed, extra? }`) |
| `POST` | `/api/challenge-runs` | Record speed challenge run and return leaderboard rank (`{ token, legA, legB, hypotenuse, durationMs, ... }`) |
| `GET` | `/api/leaderboard?limit=10` | Top completed challenge runs sorted by duration |
| `POST` | `/api/quiz-attempts` | Submit quiz attempt; computes pass/fail and returns personal best |
| `GET` | `/api/quiz-attempts?token=...` | Retrieve quiz attempt history for a student |

Deployment options:
- **School intranet / Self-hosted**: `npm run build && npm start` on any machine with Node.js.
- **Vercel / Cloud**: Push to GitHub → Import Project. SQLite database file is stored in `db/custom.db`.

## 🏗️ Project structure (feature-driven)

```
pythagorean-perigal-learning-media/
├── db/
│   └── custom.db               # Embedded SQLite database file managed by Prisma ORM
├── prisma/
│   ├── schema.prisma           # Prisma data models and schema configuration (SQLite provider)
│   └── seed.ts                 # Idempotent database seeder for demo profiles, runs, and quiz attempts
├── public/                     # Static client assets (App Logo SVG, robots.txt)
├── scripts/                    # Geometric analytical verification suite and API smoke tests
├── src/
│   ├── app/                    # Next.js App Router routing shell (Single-Page App modules)
│   │   ├── api/                # Route Handlers for background progress sync, runs, and grading
│   │   │   ├── challenge-runs/
│   │   │   ├── leaderboard/
│   │   │   ├── progress/
│   │   │   └── quiz-attempts/
│   │   ├── teacher/            # Protected real-time classroom analytics monitoring page
│   │   │   └── page.tsx
│   │   ├── globals.css         # Tailwind CSS 4 configurations and core layout grid animations
│   │   └── page.tsx            # Application core entry point (SPA view state manager)
│   ├── components/
│   │   └── ui/                 # Atomic, headless UI primitives (shadcn/ui layered over Radix)
│   ├── features/               # Main application modules (Feature-Driven Architecture)
│   │   ├── area-explorer/      # Module 1: Live dynamic SVG square area explorer and leg sliders
│   │   ├── perigal/            # Module 2: 4-stage core construction studio for square dissection
│   │   ├── evaluation/         # Module 3: Speed challenge boards and formative concept quiz
│   │   ├── landing/            # Guided discovery introduction hub and animated 3-4-5 canvas hero
│   │   ├── progress/           # Student UUID token generation and background network synchronization
│   │   ├── shared/             # Reusable puzzle canvases (AssemblyBoard pointer event engine)
│   │   └── shell/              # Core layout scaffolds (AppHeader, Footer, and Help instructions)
│   ├── hooks/                  # Global React hooks (useSyncExternalStore local storage, mobile checks)
│   └── lib/                    # Shared pure functions, theme anchors, and mathematical constants
│       ├── geometry/           # Analytical Perigal dissection algorithms and plane clipping engines
│       └── utils.ts
├── .env                        # Local production environment secrets (Database URL, Teacher Code)
├── next.config.ts              # Next.js server configuration (standalone cluster output engine)
├── package.json                # Project script registry and node dependencies (React 19, Next 16)
└── tailwind.config.ts          # Color tokens for strict color-coded Amber/Teal/Rose architecture
```

## 🛠️ Tech stack

- **Next.js 16** (App Router) + **TypeScript 5** + **React 19**
- **Tailwind CSS 4** + **shadcn/ui** (New York) + **Lucide** icons
- **Framer Motion** for UI animation; hand-rolled **rAF tween runner** for exact piece snapping
- **SVG** rendering with a world-space (y-up) → screen projector
- Pointer Events (mouse **and** touch — tablet friendly), `touch-action: none` boards
- Accessibility: semantic landmarks, ARIA labels, keyboard-operable sliders/steps,
  **Auto-assemble** as a no-drag alternative, `prefers-reduced-motion` respected

## 🔍 SEO & Google Search Console

The app ships with a complete technical-SEO layer (Next.js App Router metadata API):

| Feature | Implementation |
|---|---|
| **Metadata** | Optimized `<title>` (≤ 60 chars), meta description, keywords, canonical URL — all centralized in `src/lib/seo.ts` |
| **Open Graph / Twitter Card** | Dynamic 1200×630 image auto-generated at build time (`app/opengraph-image.tsx`) — shows title + 3-4-5 diagram when the link is shared on WhatsApp/X/Facebook/LinkedIn |
| **Structured data (JSON-LD)** | `WebApplication` + `LearningResource` + `FAQPage` (`@graph` in the root layout) → eligible for Google rich results |
| **robots.txt** | Generated dynamically by `app/robots.ts` — blocks `/api/` and `/teacher`, points to the sitemap |
| **sitemap.xml** | Generated by `app/sitemap.ts` |
| **PWA manifest** | `app/manifest.ts` → `/manifest.webmanifest` with icon set |
| **App icons** | Custom Pythagoras 3-4-5 triangle icon (`app/icon.svg`, favicon.ico, apple-icon, 192/512 PNG in `public/icons/`) |
| **Crawlable FAQ content** | Landing page shows a real FAQ accordion (single source: `FAQ_ITEMS` in `src/lib/seo.ts`) |
| **Privacy pages** | `/teacher` is `noindex, nofollow` |
| **GA4 (optional)** | Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to enable; module navigation fires a `module_view` event |

### Registering the site in Google Search Console

1. Open [search.google.com/search-console](https://search.google.com/search-console) → **Add property** → choose **URL prefix** → enter `https://pythagorean-perigal-learning-media.vercel.app/`.
2. Pick the **HTML tag** verification method. Google shows a meta tag like
   `<meta name="google-site-verification" content="TOKEN_ABC123" />` — copy **only** the token inside `content="..."`.
3. Add it to your environment (`.env` locally, or Vercel → Project → Settings → Environment Variables):

   ```env
   NEXT_PUBLIC_GSC_VERIFICATION="TOKEN_ABC123"
   ```

4. Redeploy, then click **Verify** in Search Console.
5. Submit the sitemap: GSC → **Sitemaps** → enter `sitemap.xml` → Submit.
6. Speed up first indexing: GSC → **URL Inspection** → paste the home URL → **Request Indexing**.
7. (Optional) Test rich results with the [Rich Results Test](https://search.google.com/test/rich-results) — the FAQPage and WebApplication schemas on the home page should be detected.

### Regenerating the icon set

After changing `src/app/icon.svg`, regenerate the PNG/favicon derivatives:

```bash
bun scripts/generate-icons.mjs
# then convert: python3 -c "from PIL import Image; Image.open('/tmp/icon-32.png').save('src/app/favicon.ico', sizes=[(32,32)])"
```

## 👩‍🏫 Teacher notes

- Suggested flow: Module 1 (10 min) → Module 2 (20 min, the heart of the lesson) → Module 3 (10 min).
- Let students predict the cutting angle **before** revealing it — the wrong-cut mode is a feature,
  not a bug: gaps/overlaps make the alignment condition *felt*, not memorized.
- The **Help** button (top right) shows per-module student instructions.

---

*Henry Perigal (1801–1898), British stockbroker & amateur mathematician, published this dissection
in 1836 — the proof you can touch.*
