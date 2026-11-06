'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewId } from './LearningApp';

interface ModuleFooterNavProps {
  current: ViewId;
  onChange: (v: ViewId) => void;
  onBack: () => void;
  onNext: () => void;
}

const MODULES: Array<{ id: ViewId; n: number; label: string }> = [
  { id: 'm1', n: 1, label: 'Areas & Triples' },
  { id: 'm2', n: 2, label: 'Perigal Studio' },
  { id: 'm3', n: 3, label: 'Challenge & Quiz' },
];

export function ModuleFooterNav({ current, onChange, onBack, onNext }: ModuleFooterNavProps) {
  const index = MODULES.findIndex((m) => m.id === current);
  const inModule = index >= 0;

  return (
    <footer className="sticky bottom-0 z-40 mt-auto border-t border-teal-900/10 bg-white/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur">
      <div
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-5"
        role="navigation"
        aria-label="Module navigation"
      >
        <Button
          variant="outline"
          onClick={onBack}
          disabled={current === 'landing'}
          className="min-h-11 gap-1 rounded-full"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <ol className="flex items-center gap-1.5 sm:gap-2.5">
          {MODULES.map((m, i) => {
            const active = m.id === current;
            const visited = inModule && i < index;
            return (
              <li key={m.id}>
                <button
                  onClick={() => onChange(m.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={`Module ${m.n}: ${m.label}`}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'border-teal-700 bg-teal-700 text-white shadow'
                      : visited
                        ? 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'
                        : 'border-stone-300 bg-white text-stone-600 hover:border-teal-400 hover:text-teal-700',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full text-xs font-bold',
                      active ? 'bg-white text-teal-800' : 'bg-stone-100 text-stone-700',
                    )}
                  >
                    {m.n}
                  </span>
                  <span className="hidden md:inline">{m.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <Button
          onClick={onNext}
          disabled={current === 'm3'}
          className="min-h-11 gap-1 rounded-full bg-teal-700 hover:bg-teal-800"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">{current === 'landing' ? 'Start' : 'Next'}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </footer>
  );
}
