'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Target } from 'lucide-react';
import { AreaDiagram } from './AreaDiagram';
import { fmt } from '@/lib/geometry/primitives';
import { cn } from '@/lib/utils';
import { getStudentToken } from '@/features/progress/identity';
import { syncProgress } from '@/features/progress/sync';

const TRIPLE_PRESETS: Array<[number, number]> = [
  [3, 4],
  [6, 8],
  [5, 12],
  [9, 12],
  [8, 15],
];

export function AreaExplorerView() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const hasInteractedRef = useRef(false);

  // Trigger 1: First slider interaction records progress in m1 stage 1
  const handleSliderChange = (setter: (v: number) => void, val: number) => {
    setter(val);
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      syncProgress({
        token: getStudentToken(),
        module: 'm1',
        stage: 1,
        completed: false,
      });
    }
  };

  // Trigger 2: Clicking any triple preset marks m1 completed: true
  const handleSelectPreset = (ta: number, tb: number) => {
    setA(ta);
    setB(tb);
    syncProgress({
      token: getStudentToken(),
      module: 'm1',
      stage: 1,
      completed: true,
      extra: { triple: [ta, tb] },
    });
  };

  const a2 = a * a;
  const b2 = b * b;
  const c2 = a2 + b2;
  const c = Math.sqrt(c2);
  const isTriple = Number.isInteger(c) && Number.isInteger(a) && Number.isInteger(b);

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-teal-700">
          Module 1 · Pre-concept
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Three squares, one triangle
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          The theorem is not really about numbers — it is about{' '}
          <strong className="text-stone-800">areas of squares</strong>. Drag the sliders and watch
          whether the amber and teal areas always fill the rose one.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Canvas */}
        <Card className="overflow-hidden rounded-2xl border-stone-200 p-0">
          <CardContent className="canvas-grid p-2 sm:p-4">
            <AreaDiagram a={a} b={b} />
          </CardContent>
        </Card>

        {/* Control panel */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-stone-200">
            <CardContent className="space-y-6 p-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slider-a" className="text-sm font-semibold text-amber-700">
                    Leg a (short side)
                  </Label>
                  <span className="font-mono text-lg font-bold text-amber-700" aria-live="polite">
                    a = {fmt(a)}
                  </span>
                </div>
                <Slider
                  id="slider-a"
                  min={1}
                  max={15}
                  step={1}
                  value={[a]}
                  onValueChange={(v) => handleSliderChange(setA, v[0])}
                  aria-label="Leg a length"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slider-b" className="text-sm font-semibold text-teal-700">
                    Leg b (long side)
                  </Label>
                  <span className="font-mono text-lg font-bold text-teal-700" aria-live="polite">
                    b = {fmt(b)}
                  </span>
                </div>
                <Slider
                  id="slider-b"
                  min={1}
                  max={15}
                  step={1}
                  value={[b]}
                  onValueChange={(v) => handleSliderChange(setB, v[0])}
                  aria-label="Leg b length"
                />
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Live equation
                </p>
                <p className="font-mono text-xl font-extrabold" aria-live="polite">
                  <span className="text-amber-700">{fmt(a2)}</span>
                  <span className="text-stone-400"> + </span>
                  <span className="text-teal-700">{fmt(b2)}</span>
                  <span className="text-stone-400"> = </span>
                  <span className="text-rose-600">{fmt(c2)}</span>
                </p>
                <p className="mt-1 font-mono text-sm text-stone-500">
                  a² + b² = c², so c = √{fmt(c2)} = {fmt(c)}
                </p>
              </div>

              {isTriple && (
                <Badge className="w-full justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 py-2 text-sm text-emerald-800 hover:bg-emerald-50">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Pythagorean triple found: {fmt(a)}–{fmt(b)}–{fmt(c)}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-stone-200">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Pythagorean triples
              </p>
              <div className="flex flex-wrap gap-2">
                {TRIPLE_PRESETS.map(([ta, tb]) => (
                  <Button
                    key={`${ta}-${tb}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectPreset(ta, tb)}
                    className={cn(
                      'min-h-11 rounded-full font-mono',
                      a === ta && b === tb && 'border-teal-600 bg-teal-50 text-teal-800',
                    )}
                    aria-label={`Load triple ${ta}, ${tb}`}
                  >
                    {ta}–{tb}–{Math.hypot(ta, tb)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <Target className="h-4 w-4" aria-hidden="true" /> Mission
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-900/90">
              <li>
                Set <strong>a = 3, b = 4</strong>. Now set <strong>a = 6, b = 8</strong>. Compare
                the three areas — what doubled?
              </li>
              <li>
                Hunt for a triple that is <em>not</em> in the chips row (hint: try b = 24).
              </li>
              <li>Can the amber square EVER be bigger than the teal one? Try it!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
