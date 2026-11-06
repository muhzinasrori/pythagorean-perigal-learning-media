'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, RotateCw, WifiOff } from 'lucide-react';
import { getDisplayName } from '@/features/progress/identity';
import { cn } from '@/lib/utils';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  durationMs: number;
  legA: number;
  legB: number;
  hypotenuse: number;
  challengeMode: boolean;
  createdAt: string;
}

interface LeaderboardProps {
  className?: string;
  refreshTrigger?: number;
}

function formatTime(ms: number): string {
  const s = ms / 1000;
  return `${s.toFixed(1)}s`;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return '';
  }
}

export function Leaderboard({ className, refreshTrigger = 0 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const currentName = getDisplayName();

  const loadData = useCallback(() => {
    const controller = new AbortController();

    fetch('/api/leaderboard?limit=5', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Offline or failed');
        return res.json();
      })
      .then((data: LeaderboardEntry[]) => {
        setEntries(data);
        setOffline(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setOffline(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return controller;
  }, []);

  const handleManualRefresh = () => {
    setLoading(true);
    loadData();
  };

  useEffect(() => {
    const controller = loadData();
    return () => controller.abort();
  }, [loadData, refreshTrigger]);

  return (
    <Card className={cn('rounded-2xl border-stone-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-teal-900">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Class Leaderboard (Top 5)
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          disabled={loading}
          className="h-8 w-8 p-0 text-stone-500 hover:text-stone-900"
          aria-label="Refresh leaderboard"
        >
          <RotateCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 space-y-2" aria-live="polite">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        )}

        {!loading && offline && (
          <div className="flex items-center gap-2 rounded-xl bg-stone-100 p-3 text-xs text-stone-500">
            <WifiOff className="h-4 w-4 shrink-0 text-stone-400" />
            <span>Leaderboard is offline (cached local times preserved).</span>
          </div>
        )}

        {!loading && !offline && entries.length === 0 && (
          <p className="py-4 text-center text-xs text-stone-500">
            No runs yet — be the first to complete a challenge!
          </p>
        )}

        {!loading && !offline && entries.length > 0 && (
          <div className="divide-y divide-stone-100">
            {entries.map((entry) => {
              const isCurrent =
                Boolean(currentName) &&
                entry.displayName.trim().toLowerCase() === currentName.trim().toLowerCase();

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center justify-between gap-2.5 py-2 px-1 text-sm transition-colors rounded-lg',
                    isCurrent && 'bg-amber-50/80 font-semibold'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-bold',
                        entry.rank === 1 && 'bg-amber-400 text-amber-950',
                        entry.rank === 2 && 'bg-stone-300 text-stone-800',
                        entry.rank === 3 && 'bg-amber-700/30 text-amber-900',
                        entry.rank > 3 && 'bg-stone-100 text-stone-600'
                      )}
                    >
                      {entry.rank}
                    </span>
                    <div className="truncate">
                      <span className="truncate block font-medium text-stone-900">
                        {entry.displayName}
                        {isCurrent && (
                          <span className="ml-1.5 text-[11px] text-amber-700 font-bold">(You)</span>
                        )}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {entry.legA}–{entry.legB}–{entry.hypotenuse} · {formatRelativeTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.challengeMode && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-mono text-teal-700 bg-teal-50"
                      >
                        Challenge
                      </Badge>
                    )}
                    <span className="font-mono text-sm font-bold text-stone-800">
                      {formatTime(entry.durationMs)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
