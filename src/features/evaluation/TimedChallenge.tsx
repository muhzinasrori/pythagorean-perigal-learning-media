'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dices, RotateCcw, Timer, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AssemblyBoard } from '@/features/shared/AssemblyBoard';
import { Badge } from '@/components/ui/badge';
import { getStudentToken } from '@/features/progress/identity';
import { submitChallengeRun } from '@/features/progress/sync';
import { Leaderboard } from './Leaderboard';
import {
  WorldModel,
  createWorld,
  cutSquareB,
  isCutCorrect,
  makeAPiece,
} from '@/lib/geometry/perigal';
import { fmt } from '@/lib/geometry/primitives';
import { useLocalStorage } from '@/hooks/use-local-storage';

const CHALLENGE_LEG_SETS: Array<[number, number]> = [
  [3, 4],
  [6, 8],
  [5, 12],
  [8, 15],
  [9, 12],
  [12, 16],
  [7, 24],
  [20, 21],
  [15, 20],
  [10, 24],
];

function formatTime(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const t = Math.floor((total % 1000) / 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${t}`;
}

function pickRandomLegs(exclude: [number, number]): [number, number] {
  let next = CHALLENGE_LEG_SETS[Math.floor(Math.random() * CHALLENGE_LEG_SETS.length)];
  let guard = 0;
  while (next[0] === exclude[0] && next[1] === exclude[1] && guard < 10) {
    next = CHALLENGE_LEG_SETS[Math.floor(Math.random() * CHALLENGE_LEG_SETS.length)];
    guard += 1;
  }
  return [next[0], next[1]];
}

interface TimedChallengeProps {
  onGoToQuiz: () => void;
}

export function TimedChallenge({ onGoToQuiz }: TimedChallengeProps) {
  const [legs, setLegs] = useState<[number, number]>([3, 4]);
  const [autoSignal, setAutoSignal] = useState(0);
  const [runId, setRunId] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [placed, setPlaced] = useState(0);
  const [solvedEver, setSolvedEver] = useState(false);
  const [lastUsedAuto, setLastUsedAuto] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [leaderboardVersion, setLeaderboardVersion] = useState(0);
  const [challengeMode, setChallengeMode] = useLocalStorage<boolean>(
    'pythagoras-challenge-mode',
    false,
  );
  const [bestMs, setBestMs] = useLocalStorage<number | null>('pythagoras-lab-best-ms', null);

  const world: WorldModel = useMemo(() => createWorld(legs[0], legs[1]), [legs]);
  // Challenge puzzles are always cut correctly — the challenge is assembly speed.
  const pieces = useMemo(() => [...cutSquareB(world, world.hypAngleDeg), makeAPiece(world)], [world]);
  const cutCorrect = isCutCorrect(world, world.hypAngleDeg);

  // Live ticking clock while a run is in progress
  const [now, setNow] = useState(() => 0);
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const id = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  const endTime = finishedAt ?? (now || performance.now());
  const elapsed = startedAt !== null ? endTime - startedAt : null;

  const newPuzzle = useCallback(() => {
    const next = pickRandomLegs(legs);
    setLegs(next);
    setStartedAt(null);
    setFinishedAt(null);
    setPlaced(0);
    setAutoSignal(0);
    setLastUsedAuto(false);
    setRank(null);
    setRunId((r) => r + 1);
  }, [legs]);

  const handleFirstGrab = useCallback(() => {
    setStartedAt((prev) => prev ?? performance.now());
  }, []);

  const handleComplete = useCallback(
    (meta?: { usedAuto: boolean }) => {
      if (startedAt === null) return;
      const end = performance.now();
      const dur = end - startedAt;
      setFinishedAt(end);
      const usedAuto = meta?.usedAuto ?? false;
      setLastUsedAuto(usedAuto);
      if (!usedAuto) {
        setBestMs((best) => (best === null || dur < best ? dur : best));
      }
      setSolvedEver(true);

      // Record to server challenge runs
      submitChallengeRun({
        token: getStudentToken(),
        legA: legs[0],
        legB: legs[1],
        hypotenuse: world.c,
        durationMs: Math.max(500, Math.round(dur)),
        placedCount: 5,
        usedAuto,
        challengeMode,
      }).then((res) => {
        if (res && res.rank !== null) {
          setRank(res.rank);
          setLeaderboardVersion((v) => v + 1);
        }
      });
    },
    [startedAt, setBestMs, legs, world.c, challengeMode],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <Card className="overflow-hidden rounded-2xl border-stone-200 p-0">
        <CardContent className="canvas-grid p-2 sm:p-4">
          <AssemblyBoard
            key={runId}
            world={world}
            pieces={pieces}
            cutCorrect={cutCorrect}
            onComplete={handleComplete}
            onPlacedChange={setPlaced}
            onFirstGrab={handleFirstGrab}
            autoSignal={autoSignal}
            challengeMode={challengeMode}
            seed={runId * 7919 + 42}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-2xl border-stone-200">
          <CardContent className="space-y-4 p-5">
            <p className="text-sm font-bold text-teal-900">Speed challenge</p>
            <p className="text-sm leading-relaxed text-stone-600">
              Assemble the random puzzle as fast as you can. The timer starts the moment you grab
              the first piece.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-teal-50 p-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600">
                  Now
                </p>
                <p className="font-mono text-2xl font-extrabold text-teal-800" aria-live="polite">
                  {formatTime(elapsed ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-widest text-amber-600">
                  <Trophy className="h-3 w-3" aria-hidden="true" /> Best
                </p>
                <p className="font-mono text-2xl font-extrabold text-amber-800">
                  {bestMs !== null ? formatTime(bestMs) : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-teal-50/70 p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-teal-900">Orientation challenge</p>
                <p className="text-[11px] text-teal-700/80">Rotate &amp; flip pieces to fit</p>
              </div>
              <Switch
                checked={challengeMode}
                onCheckedChange={(checked) => {
                  setChallengeMode(checked);
                  setRunId((r) => r + 1);
                  setStartedAt(null);
                  setFinishedAt(null);
                  setPlaced(0);
                }}
                aria-label="Toggle piece orientation challenge"
              />
            </div>

            <div className="rounded-xl bg-stone-100 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-stone-700">Current triangle</p>
              <p className="font-mono text-sm font-bold text-stone-800">
                a = {fmt(world.a)}, b = {fmt(world.b)}, c = {fmt(world.c)}
              </p>
              <p className="font-mono text-xs text-stone-500">
                {placed} / 5 pieces placed
              </p>
            </div>

            <div className="grid gap-2">
              <Button
                onClick={newPuzzle}
                className="min-h-12 gap-2 rounded-xl bg-teal-700 text-base hover:bg-teal-800"
              >
                <Dices className="h-4 w-4" /> New random puzzle
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStartedAt(null);
                  setFinishedAt(null);
                  setPlaced(0);
                  setRunId((r) => r + 1);
                }}
                className="min-h-11 gap-1.5 rounded-xl border-teal-600 text-teal-800"
              >
                <RotateCcw className="h-4 w-4" /> Retry this puzzle
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {finishedAt !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-5"
              role="status"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex items-center gap-2 text-base font-extrabold text-emerald-800">
                  <Timer className="h-5 w-5" aria-hidden="true" /> Assembled in{' '}
                  {formatTime((finishedAt - (startedAt ?? finishedAt)))}!
                </p>
                {rank !== null && !lastUsedAuto && (
                  <Badge className="bg-amber-500 text-stone-950 font-bold hover:bg-amber-500">
                    #{rank} of the class
                  </Badge>
                )}
              </div>
              {lastUsedAuto && (
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  (Auto-assemble assisted — timer not counted for personal best)
                </p>
              )}
              <p className="mt-1 text-sm text-emerald-900/80">
                {!lastUsedAuto && solvedEver && bestMs !== null && finishedAt - (startedAt ?? finishedAt) <= bestMs
                  ? 'New personal best — brilliant!'
                  : 'The pieces proved it again: the four parts plus a² fill c² exactly.'}
              </p>
              <Button
                onClick={onGoToQuiz}
                className="mt-3 min-h-11 w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                I&apos;m ready for the quiz →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Leaderboard refreshTrigger={leaderboardVersion} />
      </div>
    </div>
  );
}
