# Pythagoras Lab — Perigal's Dissection 📐

An **interactive, English-medium learning media** for **Grade 8 Mathematics**: students discover
the Pythagorean Theorem (**a² + b² = c²**) by building Henry Perigal's famous *dissection proof*
with their own hands — cut the square on the longer leg, drag the pieces, and watch them fill the
square on the hypotenuse **exactly**.

> Built with the **Guided Discovery Learning** model: *Predict → Construct → Reflect.*

---

## ✨ What's inside

| Module | Experience |
| --- | --- |
| **Landing** | Hero with animated 3-4-5 diagram, learning path, guided-discovery pedagogy overview |
| **Module 1 · Areas & Triples** | Live SVG diagram with sliders for legs *a* and *b*, real-time square areas, live equation, Pythagorean-triple detection & presets |
| **Module 2 · Perigal Studio** (core) | 4-stage construction: **①** draw diagonals → find centre **O** · **②** rotate the cutting lines (0–180°) with **Magnet Mode** (locks green when parallel to the hypotenuse) or **Free Mode** · **③** CUT NOW — animated dissection into 4 congruent pieces · **④** drag & drop pieces + a² into the c² frame with exact snap (translate + rotate tween), overlap/gap feedback for wrong cuts, Auto-assemble demo |
| **Module 3 · Challenge & Quiz** | **Speed challenge**: random puzzles, timer starts on first grab, best time saved (localStorage) · **Concept quiz**: 5 MCQs, instant grading, explanations, pass mark 4/5 |

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
src/
├── app/                      # App Router shell (single `/` route, SPA modules)
├── lib/
│   ├── geometry/
│   │   ├── primitives.ts     # Vec2, polygons, clipping (pure, tested)
│   │   └── perigal.ts        # Perigal dissection + assembly engine
│   └── palette.ts            # a²/b²/c² color system
├── features/
│   ├── shell/                # Header, footer nav, help dialog, view state machine
│   ├── landing/              # Hero + module cards
│   ├── area-explorer/        # Module 1
│   ├── perigal/              # Module 2 (4-stage studio canvas + controls)
│   ├── evaluation/           # Module 3 (challenge + quiz)
│   └── shared/               # AssemblyBoard (drag-drop puzzle), projector
├── components/ui/            # shadcn/ui primitives
└── hooks/                    # useLocalStorage (useSyncExternalStore)
scripts/
└── verify-geometry.ts        # Mathematical proof suite
```

## 🛠️ Tech stack

- **Next.js 16** (App Router) + **TypeScript 5** + **React 19**
- **Tailwind CSS 4** + **shadcn/ui** (New York) + **Lucide** icons
- **Framer Motion** for UI animation; hand-rolled **rAF tween runner** for exact piece snapping
- **SVG** rendering with a world-space (y-up) → screen projector
- Pointer Events (mouse **and** touch — tablet friendly), `touch-action: none` boards
- Accessibility: semantic landmarks, ARIA labels, keyboard-operable sliders/steps,
  **Auto-assemble** as a no-drag alternative, `prefers-reduced-motion` respected

## 👩‍🏫 Teacher notes

- Suggested flow: Module 1 (10 min) → Module 2 (20 min, the heart of the lesson) → Module 3 (10 min).
- Let students predict the cutting angle **before** revealing it — the wrong-cut mode is a feature,
  not a bug: gaps/overlaps make the alignment condition *felt*, not memorized.
- The **Help** button (top right) shows per-module student instructions.

---

*Henry Perigal (1801–1898), British stockbroker & amateur mathematician, published this dissection
in 1836 — the proof you can touch.*
