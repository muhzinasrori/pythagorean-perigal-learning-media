'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Compass, Scissors, Timer, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ViewId } from '@/features/shell/LearningApp';
import { PALETTE } from '@/lib/palette';

interface LandingViewProps {
  onNavigate: (v: ViewId) => void;
}

/** Decorative right-triangle-with-squares mark used in the hero (3-4-5). */
function HeroDiagram() {
  // Hand-projected from world coords (y up), scale 20 px/unit.
  // Right angle at screen (40,160); a=3 → 60 px; b=4 → 80 px; c=5 → 100 px.
  return (
    <svg
      viewBox="-60 0 380 232"
      className="w-full max-w-md"
      role="img"
      aria-label="Diagram of the 3-4-5 right triangle with squares on each side"
    >
      {/* a² square (amber), below leg a: 60×60 at (40,160) */}
      <motion.rect
        x="40"
        y="160"
        width="60"
        height="60"
        rx="4"
        fill={PALETTE.a.fill}
        stroke={PALETTE.a.stroke}
        strokeWidth="2"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      />
      <text x="70" y="196" textAnchor="middle" fontSize="14" fontWeight="700" className="fill-amber-900">
        a² = 9
      </text>

      {/* b² square (teal), left of leg b: 80×80 at (-40,80) */}
      <motion.rect
        x="-40"
        y="80"
        width="80"
        height="80"
        rx="4"
        fill={PALETTE.b.fill}
        stroke={PALETTE.b.stroke}
        strokeWidth="2"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      />
      <text x="0" y="124" textAnchor="middle" fontSize="14" fontWeight="700" className="fill-teal-50">
        b²=16
      </text>

      {/* c² square (rose) on the hypotenuse: K1(100,160) K2(180,100) K3(120,20) K4(40,80) */}
      <motion.polygon
        points="100,160 180,100 120,20 40,80"
        fill={PALETTE.c.fill}
        stroke={PALETTE.c.stroke}
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 0.95, scale: 1 }}
        transition={{ delay: 0.45 }}
        style={{ transformOrigin: '110px 90px' }}
      />
      <motion.text
        x="110"
        y="88"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        className="fill-rose-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        c² = 25
      </motion.text>

      {/* triangle: (40,160) right angle, (100,160) along a, (40,80) up b */}
      <motion.polygon
        points="40,160 100,160 40,80"
        fill={PALETTE.triangle.fill}
        stroke={PALETTE.triangle.stroke}
        strokeWidth="2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      />
      {/* right-angle marker */}
      <path d="M40 148 L52 148 L52 160" fill="none" stroke={PALETTE.triangle.stroke} strokeWidth="1.5" />
      <text x="66" y="153" fontSize="13" fontWeight="600" className="fill-stone-500">
        a
      </text>
      <text x="30" y="124" textAnchor="end" fontSize="13" fontWeight="600" className="fill-teal-50">
        b
      </text>
      <text
        x="78"
        y="112"
        fontSize="13"
        fontWeight="600"
        className="fill-stone-500"
        transform="rotate(-53 78 112)"
      >
        c
      </text>
    </svg>
  );
}

const MODULE_CARDS: Array<{
  id: ViewId;
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}> = [
  {
    id: 'm1',
    n: '1',
    icon: <Compass className="h-6 w-6" aria-hidden="true" />,
    title: 'Areas & Triples',
    desc: 'Warm up: drag legs a and b, watch the three squares change, and hunt for Pythagorean triples.',
    cta: 'Start exploring',
  },
  {
    id: 'm2',
    n: '2',
    icon: <Scissors className="h-6 w-6" aria-hidden="true" />,
    title: 'Perigal Studio',
    desc: 'The main event: find the centre, aim the cut, slice b² into four pieces, and rebuild c² with your own hands.',
    cta: 'Open the studio',
  },
  {
    id: 'm3',
    n: '3',
    icon: <Trophy className="h-6 w-6" aria-hidden="true" />,
    title: 'Challenge & Quiz',
    desc: 'Race the clock on random puzzles, then check your understanding with a 5-question quiz.',
    cta: 'Take the challenge',
  },
];

export function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2" aria-labelledby="hero-title">
        <div className="space-y-5">
          <Badge className="rounded-full border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100">
            Grade 8 · Mathematics · English
          </Badge>
          <h1
            id="hero-title"
            className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl lg:text-[2.6rem]"
          >
            Prove the Pythagorean Theorem <span className="text-teal-700">with your own hands.</span>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-stone-600 sm:text-base">
            In 1836, Henry Perigal discovered something amazing: cut the square on the{' '}
            <span className="font-semibold text-teal-700">longer leg</span> the right way, and its
            pieces — together with the square on the shorter leg — fit{' '}
            <span className="font-semibold text-rose-600">perfectly</span> inside the square on the
            hypotenuse. In this lab, you make the cut yourself.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate('m1')}
              className="min-h-12 gap-2 rounded-full bg-teal-700 px-6 text-base hover:bg-teal-800"
            >
              Start learning <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('m2')}
              className="min-h-12 gap-2 rounded-full border-teal-600 px-6 text-base text-teal-800 hover:bg-teal-50"
            >
              <Scissors className="h-4 w-4" aria-hidden="true" /> Jump to the dissection
            </Button>
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-stone-500">
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <dt className="sr-only">Format</dt>
              <dd>3 guided modules</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <dt className="sr-only">Assessment</dt>
              <dd>Quiz with instant grading</dd>
            </div>
          </dl>
        </div>

        <div className="canvas-grid flex justify-center rounded-3xl border border-teal-100 bg-white p-4 shadow-sm sm:p-6">
          <HeroDiagram />
        </div>
      </section>

      {/* Equation strip */}
      <section aria-label="The theorem">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-center font-mono text-lg font-bold shadow-sm sm:text-2xl">
          <span className="rounded-lg bg-amber-100 px-3 py-1 text-amber-900">a²</span>
          <span className="text-stone-500">+</span>
          <span className="rounded-lg bg-teal-100 px-3 py-1 text-teal-900">b²</span>
          <span className="text-stone-500">=</span>
          <span className="rounded-lg bg-rose-100 px-3 py-1 text-rose-900">c²</span>
          <span className="ml-3 font-sans text-xs font-medium text-stone-500 sm:text-sm">
            leg² + leg² = hypotenuse² — as AREAS, not just numbers.
          </span>
        </div>
      </section>

      {/* Module cards */}
      <section aria-labelledby="modules-title" className="space-y-4">
        <h2 id="modules-title" className="text-xl font-bold text-stone-900">
          Your learning path
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {MODULE_CARDS.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Card className="h-full rounded-2xl border-stone-200 transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-700 text-white">
                      {m.icon}
                    </span>
                    <span className="font-mono text-4xl font-extrabold text-stone-200">{m.n}</span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">{m.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-stone-600">{m.desc}</p>
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate(m.id)}
                    className="min-h-11 w-fit gap-1.5 rounded-full px-4 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                  >
                    {m.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Guided discovery */}
      <section
        aria-labelledby="pedagogy-title"
        className="grid gap-4 rounded-3xl border border-teal-100 bg-teal-50/60 p-6 sm:p-8 md:grid-cols-3"
      >
        <h2 id="pedagogy-title" className="text-xl font-bold text-teal-900 md:col-span-3">
          How you will discover the theorem
        </h2>
        {[
          {
            step: 'Predict',
            text: 'Before cutting anything, you choose the angle yourself and predict whether the pieces will fit.',
          },
          {
            step: 'Construct',
            text: 'You slice square b² and physically drag every piece into the hypotenuse square c².',
          },
          {
            step: 'Reflect',
            text: 'You conclude why the cut must be parallel to the hypotenuse — and what a² + b² = c² really means.',
          },
        ].map((s) => (
          <div key={s.step} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-teal-700">
              {s.step}
            </p>
            <p className="text-sm leading-relaxed text-stone-600">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
