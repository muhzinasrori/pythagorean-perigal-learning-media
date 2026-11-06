/**
 * Resilient, best-effort client background sync queue.
 *
 * All database writes flow through queueSync. If the network or server fails,
 * a single retry is attempted after 5 seconds. If that still fails, the sync
 * drops silently with a console warning.
 *
 * Offline first: UI state NEVER blocks on or waits for server sync.
 */
import {
  progressSchema,
  challengeRunSchema,
  quizAttemptSchema,
  type ProgressInput,
  type ChallengeRunInput,
  type QuizAttemptInput,
} from '@/lib/validation/progress';
import { ensureStudentRegistered } from './identity';

type SyncOperation = () => Promise<Response>;

/**
 * Enqueues a sync operation for immediate execution with one delayed retry on failure.
 */
export function queueSync(fn: SyncOperation): void {
  // Always trigger registration if not already complete
  ensureStudentRegistered();

  fn()
    .then((res) => {
      if (!res.ok && res.status >= 500) {
        throw new Error(`Server status ${res.status}`);
      }
    })
    .catch((firstErr) => {
      console.warn('[Sync] Initial attempt failed, retrying in 5s...', firstErr);
      setTimeout(() => {
        fn()
          .then((retryRes) => {
            if (!retryRes.ok) {
              console.warn(`[Sync] Retry completed with non-OK status: ${retryRes.status}`);
            }
          })
          .catch((retryErr) => {
            console.warn('[Sync] Dropped payload after retry failure:', retryErr);
          });
      }, 5000);
    });
}

/**
 * Syncs module progress (PUT /api/progress).
 */
export function syncProgress(data: ProgressInput): void {
  const parsed = progressSchema.safeParse(data);
  if (!parsed.success) {
    console.warn('[Sync] Invalid progress payload rejected:', parsed.error);
    return;
  }

  queueSync(() =>
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
  );
}

/**
 * Syncs a completed challenge run (POST /api/challenge-runs).
 * Optionally returns the server rank callback for UI display.
 */
export async function submitChallengeRun(
  data: ChallengeRunInput
): Promise<{ rank: number | null } | null> {
  const parsed = challengeRunSchema.safeParse(data);
  if (!parsed.success) {
    console.warn('[Sync] Invalid challenge run payload:', parsed.error);
    return null;
  }

  ensureStudentRegistered();

  try {
    const res = await fetch('/api/challenge-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      const json = await res.json();
      return { rank: json.rank ?? null };
    }
  } catch (err) {
    console.warn('[Sync] Failed direct challenge run submission, queuing retry...', err);
  }

  // Fallback to retry queue if direct attempt failed
  queueSync(() =>
    fetch('/api/challenge-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
  );

  return null;
}

/**
 * Syncs a completed quiz attempt (POST /api/quiz-attempts).
 */
export function syncQuizAttempt(data: QuizAttemptInput): void {
  const parsed = quizAttemptSchema.safeParse(data);
  if (!parsed.success) {
    console.warn('[Sync] Invalid quiz attempt payload:', parsed.error);
    return;
  }

  queueSync(() =>
    fetch('/api/quiz-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
  );
}
