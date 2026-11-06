'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Timer } from 'lucide-react';
import { TimedChallenge } from './TimedChallenge';
import { ConceptQuiz } from './ConceptQuiz';

export function EvaluationView() {
  const [tab, setTab] = useState<'challenge' | 'quiz'>('challenge');

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-teal-700">
          Module 3 · Evaluation &amp; reflection
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Prove your mastery
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          Two ways to show what you discovered: race the clock on a random Perigal puzzle, or take
          the concept quiz with instant grading.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'challenge' | 'quiz')}>
        <TabsList className="h-12 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-1.5 sm:w-auto">
          <TabsTrigger
            value="challenge"
            className="min-h-10 gap-1.5 rounded-xl px-4 text-sm font-semibold data-[state=active]:bg-teal-700 data-[state=active]:text-white"
          >
            <Timer className="h-4 w-4" aria-hidden="true" /> Speed challenge
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="min-h-10 gap-1.5 rounded-xl px-4 text-sm font-semibold data-[state=active]:bg-teal-700 data-[state=active]:text-white"
          >
            <Scissors className="h-4 w-4" aria-hidden="true" /> Concept quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenge" className="pt-4">
          <TimedChallenge onGoToQuiz={() => setTab('quiz')} />
        </TabsContent>
        <TabsContent value="quiz" className="pt-4">
          <ConceptQuiz />
        </TabsContent>
      </Tabs>
    </div>
  );
}
