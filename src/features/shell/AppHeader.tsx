'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleHelp, GraduationCap, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NameDialog } from '@/features/progress/NameDialog';
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
          <Image
            src="/logo.svg"
            alt="Pythagoras Lab Logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">Pythagorean Lab</span>
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
          <NameDialog />
          <Button
            variant="secondary"
            size="sm"
            onClick={onHelp}
            className="min-h-11 gap-1.5 rounded-full bg-white/15 px-3 text-white shadow-none hover:bg-white/25 hover:text-white"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="min-h-11 gap-1.5 rounded-full bg-white/15 px-3 text-white shadow-none hover:bg-white/25 hover:text-white"
          >
            <Link href="/teacher" title="Teacher Analytics Dashboard">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Teacher</span>
            </Link>
          </Button>
          <span className="sr-only">
            <House /> Home
          </span>
        </nav>
      </div>
    </header>
  );
}
