'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Dices,
  Lock,
  RotateCcw,
  Scissors,
  Sparkles,
  Undo2,
  Wand2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { StudioCanvas } from './StudioCanvas';
import { AssemblyBoard } from '@/features/shared/AssemblyBoard';
import {
  WorldModel,
  createWorld,
  cutSquareB,
  isCutCorrect,
  makeAPiece,
  snapCutAngle,
} from '@/lib/geometry/perigal';
import { fmt } from '@/lib/geometry/primitives';
import { cn } from '@/lib/utils';
import type { ViewId } from '@/features/shell/LearningApp';

type Stage = 1 | 2 | 3 | 4;

const PRESETS: Array<[number, number]> = [
  [3, 4],
  [5, 12],
  [8, 15],
  [9, 12],
  [7, 24],
];

const STAGE_META: Array<{ n: Stage; label: string }> = [
  { n: 1, label: 'Find centre O' },
  { n: 2, label: 'Aim the cut' },
  { n: 3, label: 'Cut b²' },
  { n: 4, label: 'Build c²' },
];

interface PerigalStudioViewProps {
  onNavigateModule?: (v: ViewId) => void;
}

export function PerigalStudioView({ onNavigateModule }: PerigalStudioViewProps) {
  const [legs, setLegs] = useState<[number, number]>([3, 4]);
  const [stage, setStage] = useState<Stage>(1);
  const [diag1, setDiag1] = useState(false);
  const [diag2, setDiag2] = useState(false);
  const [cutAngle, setCutAngle] = useState(15);
  const [magnet, setMagnet] = useState(true);
  const [cutExecuted, setCutExecuted] = useState(false);
  const [autoSignal, setAutoSignal] = useState(0);
  const [boardKey, setBoardKey] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [solved, setSolved] = useState(false);

  const world: WorldModel = useMemo(() => createWorld(legs[0], legs[1]), [legs]);
  const cutCorrect = isCutCorrect(world, cutAngle);
  const boardPieces = useMemo(
    () => (cutExecuted ? [...cutSquareB(world, cutAngle), makeAPiece(world)] : []),
    [world, cutAngle, cutExecuted],
  );

  const unlocked = (n: Stage) =>
    n === 1 || (n === 2 && diag2) || (n === 3 && diag2) || (n === 4 && cutExecuted);

  const newTriangle = () => {
    const next = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    const different = next[0] !== legs[0] || next[1] !== legs[1] ? next : PRESETS[(PRESETS.indexOf(next) + 1) % PRESETS.length];
    setLegs(different);
    setDiag1(false);
    setDiag2(false);
    setCutAngle(15);
    setCutExecuted(false);
    setPlaced(0);
    setSolved(false);
    setStage(1);
  };

  const goStage = (n: Stage) => {
    if (!unlocked(n)) return;
    if (n < 4) setSolved(false);
    setStage(n);
  };

  const handleSlider = (v: number) => {
    if (magnet && isCutCorrect(world, v, 4)) {
      const snapped = snapCutAngle(world, v);
      setCutAngle(snapped);
    } else {
      setCutAngle(v);
    }
  };

  const locked = magnet && cutCorrect;

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-teal-700">
          Module 2 · Core dissection studio
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Perigal&apos;s Studio — build the proof yourself
        </h1>
      </header>

      {/* Stage stepper */}
      <nav aria-label="Studio steps">
        <ol className="flex flex-wrap gap-2">
          {STAGE_META.map((s) => {
            const active = stage === s.n;
            const open = unlocked(s.n);
            return (
              <li key={s.n}>
                <button
                  onClick={() => goStage(s.n)}
                  disabled={!open}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-teal-700 bg-teal-700 text-white shadow'
                      : open
                        ? 'border-teal-300 bg-white text-teal-800 hover:bg-teal-50'
                        : 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full font-mono text-xs font-bold',
                      active ? 'bg-white text-teal-800' : open ? 'bg-teal-100 text-teal-800' : 'bg-stone-200 text-stone-500',
                    )}
                  >
                    {s.n}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Workspace */}
        <Card className="overflow-hidden rounded-2xl border-stone-200 p-0">
          <CardContent className="canvas-grid p-2 sm:p-4">
            {stage === 4 ? (
              <AssemblyBoard
                key={boardKey}
                world={world}
                pieces={boardPieces}
                cutCorrect={cutCorrect}
                onComplete={() => setSolved(true)}
                onPlacedChange={setPlaced}
                autoSignal={autoSignal}
              />
            ) : (
              <StudioCanvas
                world={world}
                stage={stage}
                diag1={diag1}
                diag2={diag2}
                cutAngle={cutAngle}
                cutExecuted={cutExecuted}
              />
            )}
          </CardContent>
        </Card>

        {/* Control panel */}
        <div className="space-y-4">
          {/* Triangle info + presets */}
          <Card className="rounded-2xl border-stone-200">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-sm font-bold">
                  <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-amber-900">
                    a = {fmt(world.a)}
                  </span>
                  <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-teal-900">
                    b = {fmt(world.b)}
                  </span>
                  <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-rose-700">
                    c = {fmt(world.c)}
                  </span>
                </div>
                {stage > 1 && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
                    title="Triangle dimensions are locked for steps 2–4. Return to Step 1 to change."
                  >
                    <Lock className="h-3 w-3 text-stone-500" aria-hidden="true" />
                    Locked
                  </span>
                )}
              </div>

              {stage === 1 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESETS.map(([pa, pb]) => (
                    <Button
                      key={`${pa}-${pb}`}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'min-h-10 rounded-full px-2.5 font-mono text-xs',
                        legs[0] === pa && legs[1] === pb && 'border-teal-600 bg-teal-50 text-teal-800',
                      )}
                      onClick={() => {
                        if (legs[0] === pa && legs[1] === pb) return;
                        setLegs([pa, pb]);
                        setDiag1(false);
                        setDiag2(false);
                        setCutAngle(15);
                        setCutExecuted(false);
                        setPlaced(0);
                        setSolved(false);
                        setStage(1);
                      }}
                      aria-label={`Use triangle ${pa}, ${pb}`}
                    >
                      {pa}–{pb}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10 gap-1 rounded-full px-2.5 text-xs"
                    onClick={newTriangle}
                  >
                    <Dices className="h-3.5 w-3.5" aria-hidden="true" /> Random
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-stone-500" aria-live="polite">
                  Triangle locked during dissection. Return to <strong>Step 1</strong> to select a different triangle.
                </p>
              )}
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            {/* ---------------- STAGE 1 ---------------- */}
            {stage === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="rounded-2xl border-teal-200">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-bold text-teal-900">Step 1 — Find the centre O</p>
                    <p className="text-sm leading-relaxed text-stone-600">
                      Every square has a secret point: its <strong>centre</strong>. Draw both
                      diagonals of square b² — they always cross exactly at the centre.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setDiag1(true)}
                        disabled={diag1}
                        variant="outline"
                        className="min-h-11 flex-1 rounded-xl border-teal-600 text-teal-800"
                      >
                        {diag1 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                        Diagonal 1
                      </Button>
                      <Button
                        onClick={() => setDiag2(true)}
                        disabled={diag2 || !diag1}
                        variant="outline"
                        className="min-h-11 flex-1 rounded-xl border-teal-600 text-teal-800"
                      >
                        {diag2 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                        Diagonal 2
                      </Button>
                    </div>
                    {diag1 && diag2 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                      >
                        Meet point <strong>O</strong> — the centre of b². The dissection will cut
                        straight through it.
                      </motion.p>
                    )}
                    <Button
                      onClick={() => setStage(2)}
                      disabled={!diag2}
                      className="min-h-12 w-full gap-2 rounded-xl bg-teal-700 text-base hover:bg-teal-800"
                    >
                      Go to Step 2 <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------------- STAGE 2 ---------------- */}
            {stage === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="rounded-2xl border-teal-200">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-bold text-teal-900">Step 2 — Aim the cut</p>
                    <p className="text-sm leading-relaxed text-stone-600">
                      Rotate the orange cutting lines around <strong>O</strong>. The dashed rose
                      line shows the hypotenuse direction. Predict first: which angle will let the
                      pieces fit inside c²?
                    </p>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cut-angle" className="text-sm font-semibold">
                          Cut angle
                        </Label>
                        <span className="font-mono text-lg font-bold text-amber-700" aria-live="polite">
                          {fmt(cutAngle, 1)}°
                        </span>
                      </div>
                      <Slider
                        id="cut-angle"
                        min={0}
                        max={180}
                        step={0.5}
                        value={[cutAngle]}
                        onValueChange={(v) => handleSlider(v[0])}
                        aria-label="Cut angle in degrees"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5">
                      <div>
                        <Label htmlFor="magnet-mode" className="text-sm font-semibold text-stone-800">
                          Magnet mode
                        </Label>
                        <p className="text-xs text-stone-500">Locks when parallel to c</p>
                      </div>
                      <Switch id="magnet-mode" checked={magnet} onCheckedChange={setMagnet} aria-label="Toggle magnet mode" />
                    </div>

                    <div
                      aria-live="polite"
                      className={cn(
                        'flex items-start gap-2 rounded-xl p-3 text-sm font-medium',
                        locked ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900',
                      )}
                    >
                      {locked ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      {locked
                        ? 'Cutting line locked — it is exactly parallel to the hypotenuse c!'
                        : magnet
                          ? 'Keep rotating… the lines will lock when they are parallel to c.'
                          : 'Free mode: you may cut at any angle — but will the pieces fit?'}
                    </div>

                    <Button
                      onClick={() => {
                        setCutExecuted(true);
                        setStage(3);
                      }}
                      className="min-h-12 w-full gap-2 rounded-xl bg-teal-700 text-base font-bold hover:bg-teal-800"
                    >
                      <Scissors className="h-5 w-5" /> CUT NOW
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------------- STAGE 3 ---------------- */}
            {stage === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="rounded-2xl border-teal-200">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-bold text-teal-900">Step 3 — b² is cut!</p>
                    <p className="text-sm leading-relaxed text-stone-600">
                      Square b² is now <strong>4 congruent pieces</strong> (cut at{' '}
                      <span className="font-mono font-bold">{fmt(cutAngle, 1)}°</span> through the
                      centre O).
                    </p>
                    <div
                      className={cn(
                        'rounded-xl p-3 text-sm font-medium',
                        cutCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900',
                      )}
                    >
                      {cutCorrect
                        ? 'The cut is parallel to the hypotenuse — this puzzle CAN be assembled perfectly.'
                        : 'This angle is NOT parallel to the hypotenuse. You can still try to assemble it — watch what goes wrong.'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCutExecuted(false);
                          setStage(2);
                        }}
                        className="min-h-11 flex-1 gap-1.5 rounded-xl border-teal-600 text-teal-800"
                      >
                        <Undo2 className="h-4 w-4" /> Re-aim
                      </Button>
                      <Button
                        onClick={() => {
                          setBoardKey((k) => k + 1);
                          setPlaced(0);
                          setStage(4);
                        }}
                        className="min-h-11 flex-1 gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800"
                      >
                        Assemble c² <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------------- STAGE 4 ---------------- */}
            {stage === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="rounded-2xl border-teal-200">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-bold text-teal-900">Step 4 — Build c²</p>
                    <p className="text-sm leading-relaxed text-stone-600">
                      Drag pieces <span className="font-mono font-bold">1–4</span> and the amber{' '}
                      <span className="font-mono font-bold">a²</span> square into the dashed rose
                      frame. They snap when close.
                    </p>

                    <div className="flex items-center justify-between rounded-xl bg-stone-100 px-3.5 py-2.5">
                      <span className="text-sm font-semibold text-stone-700">Pieces placed</span>
                      <span className="font-mono text-lg font-bold text-teal-800" aria-live="polite">
                        {placed} / 5
                      </span>
                    </div>

                    {!cutCorrect && (
                      <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                        These pieces can <strong>never</strong> fill c² — your cut wasn&apos;t
                        parallel to the hypotenuse. Notice the gaps and overlaps!
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setAutoSignal((s) => s + 1)}
                        disabled={!cutCorrect}
                        className="col-span-2 min-h-11 gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800"
                      >
                        <Wand2 className="h-4 w-4" /> Auto-assemble
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBoardKey((k) => k + 1);
                          setPlaced(0);
                        }}
                        className="min-h-11 gap-1.5 rounded-xl border-teal-600 text-teal-800"
                      >
                        <RotateCcw className="h-4 w-4" /> Reset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCutExecuted(false);
                          setSolved(false);
                          setPlaced(0);
                          setStage(2);
                        }}
                        className="min-h-11 gap-1.5 rounded-xl border-teal-600 text-teal-800"
                      >
                        <Undo2 className="h-4 w-4" /> Fix the cut
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success banner */}
          <AnimatePresence>
            {solved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg"
                role="status"
              >
                <div className="space-y-3 p-5">
                  <p className="flex items-center gap-2 text-base font-extrabold text-emerald-800">
                    <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    Proof complete — a² + b² = c² !
                  </p>
                  <p className="font-mono text-lg font-bold text-stone-800">
                    <span className="text-amber-700">{fmt(world.a * world.a)}</span>
                    <span className="text-stone-400"> + </span>
                    <span className="text-teal-700">{fmt(world.b * world.b)}</span>
                    <span className="text-stone-400"> = </span>
                    <span className="text-rose-600">{fmt(world.a * world.a + world.b * world.b)}</span>
                    <span className="ml-2 font-sans text-sm font-medium text-stone-500">
                      — the four pieces plus a² filled c² exactly.
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      onClick={newTriangle}
                      className="min-h-11 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Dices className="h-4 w-4" /> Try another triangle
                    </Button>
                    {onNavigateModule && (
                      <Button
                        variant="outline"
                        onClick={() => onNavigateModule('m3')}
                        className="min-h-11 gap-1.5 rounded-xl border-emerald-500 text-emerald-800 hover:bg-emerald-50"
                      >
                        Go to Module 3 <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
