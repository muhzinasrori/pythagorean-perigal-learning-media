'use client';

import { CircleHelp, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewId } from './LearningApp';

interface AppHeaderProps {
  moduleTitle: string;
  onHelp: () => void;
  onHome: () => void;
}

export function AppHeader({ moduleTitle, onHelp, onHome }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-teal-900/10 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 text-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
        <button
          onClick={onHome}
          className="flex min-h-11 items-center gap-2.5 rounded-lg px-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          aria-label="Go to home"
        >
          <svg viewBox="0 0 28 28" className="h-8 w-8 shrink-0" aria-hidden="true">
            <rect x="1.5" y="14.5" width="11" height="11" rx="1.5" fill="#fbbf24" />
            <rect x="14.5" y="1.5" width="11" height="11" rx="1.5" fill="#5eead4" opacity="0.9" />
            <path d="M3 25 L25 3 L25 25 Z" fill="#fb7185" opacity="0.92" />
          </svg>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">Pythagoras Lab</span>
            <span className="block text-[11px] font-medium text-teal-100/90">
              Perigal&apos;s Dissection · Grade 8
            </span>
          </span>
        </button>

        <nav className="flex items-center gap-2" aria-label="Application">
          <span
            className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-teal-50 sm:inline-block"
            aria-live="polite"
          >
            {moduleTitle}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onHelp}
            className="min-h-11 gap-1.5 rounded-full bg-white/15 px-3 text-white shadow-none hover:bg-white/25 hover:text-white"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <span className="sr-only">
            <House /> Home
          </span>
        </nav>
      </div>
    </header>
  );
}
