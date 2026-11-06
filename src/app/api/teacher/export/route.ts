/**
 * GET /api/teacher/export
 *
 * Exports class analytics and student progress summary as a CSV spreadsheet.
 * Gated by TEACHER_ACCESS_CODE cookie if configured.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const teacherCode = process.env.TEACHER_ACCESS_CODE;
  if (teacherCode) {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('teacher_code')?.value;
    if (cookieVal !== teacherCode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const students = await db.student.findMany({
      include: {
        progresses: true,
        challengeRuns: true,
        quizAttempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const headers = [
      'Token',
      'DisplayName',
      'LastActivity',
      'M1_Completed',
      'M2_Completed',
      'M3_Completed',
      'BestChallengeDurationSec',
      'TotalRuns',
      'ChallengeModePercent',
      'QuizBestScore',
      'QuizPassed',
    ];

    const rows = students.map((s) => {
      const m1 = s.progresses.find((p) => p.module === 'm1')?.completed ?? false;
      const m2 = s.progresses.find((p) => p.module === 'm2')?.completed ?? false;
      const m3 = s.progresses.find((p) => p.module === 'm3')?.completed ?? false;

      const validRuns = s.challengeRuns.filter((r) => r.placedCount === 5 && !r.usedAuto);
      const bestRun = validRuns.length > 0
        ? Math.min(...validRuns.map((r) => r.durationMs))
        : null;

      const challengeModeRuns = s.challengeRuns.filter((r) => r.challengeMode).length;
      const challengePercent = s.challengeRuns.length > 0
        ? Math.round((challengeModeRuns / s.challengeRuns.length) * 100)
        : 0;

      const bestQuiz = s.quizAttempts.length > 0
        ? Math.max(...s.quizAttempts.map((q) => q.score))
        : null;
      const quizPassed = s.quizAttempts.some((q) => q.passed);

      return [
        s.token,
        s.displayName ?? 'Anonymous',
        s.updatedAt.toISOString(),
        m1 ? 'Yes' : 'No',
        m2 ? 'Yes' : 'No',
        m3 ? 'Yes' : 'No',
        bestRun !== null ? (bestRun / 1000).toFixed(1) : '',
        s.challengeRuns.length,
        `${challengePercent}%`,
        bestQuiz !== null ? `${bestQuiz}/5` : '',
        quizPassed ? 'Yes' : 'No',
      ].map(escapeCsv).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pythagoras-class-overview.csv"',
      },
    });
  } catch (err: unknown) {
    console.error('Error generating teacher CSV export:', err);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}
