'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppHeader } from './AppHeader';
import { ModuleFooterNav } from './ModuleFooterNav';
import { HelpDialog } from './HelpDialog';
import { LandingView } from '@/features/landing/LandingView';
import { AreaExplorerView } from '@/features/area-explorer/AreaExplorerView';
import { PerigalStudioView } from '@/features/perigal/PerigalStudioView';
import { EvaluationView } from '@/features/evaluation/EvaluationView';

export type ViewId = 'landing' | 'm1' | 'm2' | 'm3';

export const VIEW_ORDER: ViewId[] = ['landing', 'm1', 'm2', 'm3'];

const MODULE_TITLES: Record<ViewId, string> = {
  landing: 'Home',
  m1: 'Module 1 · Areas & Triples',
  m2: 'Module 2 · Perigal Studio',
  m3: 'Module 3 · Challenge & Quiz',
};

/**
 * SPA shell — the whole learning media lives on the `/` route and switches
 * between modules with a client-side state machine (smooth transitions,
 * zero full page reloads, tablet friendly).
 */
export function LearningApp() {
  const [view, setView] = useState<ViewId>('landing');
  const [helpOpen, setHelpOpen] = useState(false);

  const indexOf = VIEW_ORDER.indexOf(view);
  const goNext = () => setView(VIEW_ORDER[Math.min(indexOf + 1, VIEW_ORDER.length - 1)]);
  const goBack = () => setView(VIEW_ORDER[Math.max(indexOf - 1, 0)]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 via-background to-teal-50/40">
      <AppHeader
        moduleTitle={MODULE_TITLES[view]}
        onHelp={() => setHelpOpen(true)}
        onHome={() => setView('landing')}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-5 sm:py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {view === 'landing' && <LandingView onNavigate={setView} />}
            {view === 'm1' && <AreaExplorerView />}
            {view === 'm2' && <PerigalStudioView onNavigateModule={setView} />}
            {view === 'm3' && <EvaluationView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <ModuleFooterNav current={view} onChange={setView} onBack={goBack} onNext={goNext} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} topic={view} />
    </div>
  );
}
