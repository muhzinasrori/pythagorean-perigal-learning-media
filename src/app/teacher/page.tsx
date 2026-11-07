import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { db } from '@/lib/db';
import { TeacherLoginForm } from '@/features/teacher/TeacherLoginForm';
import { logoutTeacher } from '@/features/teacher/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Timer,
  Award,
  Download,
  LogOut,
  AlertTriangle,
  ArrowUpDown,
  ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// The teacher dashboard is private (student data) — keep it out of search engines.
export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface PageProps {
  searchParams: Promise<{ sort?: string }>;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const s = ms / 1000;
  return `${s.toFixed(1)}s`;
}

function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default async function TeacherPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const sort = resolvedParams.sort ?? 'activity';

  const teacherCode = process.env.TEACHER_ACCESS_CODE;
  const cookieStore = await cookies();
  const currentCookie = cookieStore.get('teacher_code')?.value;

  // Gate check
  const isProtected = Boolean(teacherCode);
  const isAuthenticated = !isProtected || currentCookie === teacherCode;

  if (!isAuthenticated) {
    return <TeacherLoginForm />;
  }

  // Fetch all students and aggregated analytics
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

  // Calculate summary metrics
  const totalStudents = students.length;
  const totalRuns = students.reduce((acc, s) => acc + s.challengeRuns.length, 0);

  const allAttempts = students.flatMap((s) => s.quizAttempts);
  const passingAttempts = allAttempts.filter((a) => a.passed).length;
  const quizPassRate = allAttempts.length > 0
    ? Math.round((passingAttempts / allAttempts.length) * 100)
    : 0;

  // Process rows with aggregated fields
  const studentRows = students.map((s) => {
    const m1 = s.progresses.find((p) => p.module === 'm1')?.completed ?? false;
    const m2 = s.progresses.find((p) => p.module === 'm2')?.completed ?? false;
    const m3 = s.progresses.find((p) => p.module === 'm3')?.completed ?? false;

    const validRuns = s.challengeRuns.filter((r) => r.placedCount === 5 && !r.usedAuto);
    const bestTimeMs = validRuns.length > 0
      ? Math.min(...validRuns.map((r) => r.durationMs))
      : null;

    const challengeRunsCount = s.challengeRuns.filter((r) => r.challengeMode).length;
    const challengePercent = s.challengeRuns.length > 0
      ? Math.round((challengeRunsCount / s.challengeRuns.length) * 100)
      : 0;

    const bestQuizScore = s.quizAttempts.length > 0
      ? Math.max(...s.quizAttempts.map((q) => q.score))
      : null;
    const hasPassedQuiz = s.quizAttempts.some((q) => q.passed);

    return {
      id: s.id,
      token: s.token,
      displayName: s.displayName ?? 'Anonymous',
      updatedAt: s.updatedAt,
      m1,
      m2,
      m3,
      bestTimeMs,
      totalRuns: s.challengeRuns.length,
      challengePercent,
      bestQuizScore,
      hasPassedQuiz,
      quizAttemptsCount: s.quizAttempts.length,
    };
  });

  // Sort rows based on searchParams
  studentRows.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'time':
        if (a.bestTimeMs === null) return 1;
        if (b.bestTimeMs === null) return -1;
        return a.bestTimeMs - b.bestTimeMs;
      case 'quiz':
        return (b.bestQuizScore ?? -1) - (a.bestQuizScore ?? -1);
      case 'runs':
        return b.totalRuns - a.totalRuns;
      case 'activity':
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  return (
    <div className="min-h-screen bg-stone-50/50 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to App
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Teacher Dashboard &amp; Class Analytics
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            Real-time Grade 8 discovery progress, challenge speed, and proof mastery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-stone-300 min-h-10 gap-2 text-stone-700 hover:bg-stone-100"
          >
            <a href="/api/teacher/export" download>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>

          {isProtected && (
            <form action={logoutTeacher}>
              <Button
                type="submit"
                variant="ghost"
                className="rounded-xl min-h-10 gap-1.5 text-stone-600 hover:text-stone-900"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Intranet Open Mode Banner */}
      {!isProtected && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <strong className="font-semibold">Open Mode (Intranet):</strong> No{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs font-bold">
              TEACHER_ACCESS_CODE
            </code>{' '}
            is set in the environment. Dashboard is accessible without password.
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-stone-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-stone-600">Total Students</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-stone-900">{totalStudents}</div>
            <p className="text-xs text-stone-500 mt-1">Unique student capability tokens</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-stone-600">Total Challenge Runs</CardTitle>
            <Timer className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-stone-900">{totalRuns}</div>
            <p className="text-xs text-stone-500 mt-1">Speed puzzle runs recorded</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-stone-600">Quiz Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">{quizPassRate}%</div>
            <p className="text-xs text-stone-500 mt-1">
              {passingAttempts} passed of {allAttempts.length} total attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-stone-100 bg-white px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-stone-900">Student Roster</CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Click column headers to sort by student name, speed run time, or quiz score.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1" />
              Completed
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-300 ml-2 mr-1" />
              In Progress
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead className="w-[180px]">
                  <Link
                    href={`/teacher?sort=name`}
                    className="inline-flex items-center gap-1 font-bold text-stone-800 hover:text-teal-700"
                  >
                    Student <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </TableHead>
                <TableHead className="text-center">
                  <span className="font-bold text-stone-800">Modules (M1 · M2 · M3)</span>
                </TableHead>
                <TableHead>
                  <Link
                    href={`/teacher?sort=time`}
                    className="inline-flex items-center gap-1 font-bold text-stone-800 hover:text-teal-700"
                  >
                    Best Challenge <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </TableHead>
                <TableHead>
                  <Link
                    href={`/teacher?sort=quiz`}
                    className="inline-flex items-center gap-1 font-bold text-stone-800 hover:text-teal-700"
                  >
                    Quiz Best <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </TableHead>
                <TableHead className="text-center">
                  <Link
                    href={`/teacher?sort=runs`}
                    className="inline-flex items-center gap-1 font-bold text-stone-800 hover:text-teal-700"
                  >
                    Runs (Chl %) <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </TableHead>
                <TableHead className="text-right">
                  <Link
                    href={`/teacher?sort=activity`}
                    className="inline-flex items-center gap-1 font-bold text-stone-800 hover:text-teal-700"
                  >
                    Last Active <ArrowUpDown className="h-3 w-3" />
                  </Link>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {studentRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-stone-500 text-sm">
                    No students have joined yet.
                  </TableCell>
                </TableRow>
              ) : (
                studentRows.map((student) => (
                  <TableRow key={student.id} className="hover:bg-stone-50/70 transition-colors">
                    <TableCell className="font-medium">
                      <div className="font-semibold text-stone-900">{student.displayName}</div>
                      <div className="font-mono text-[10px] text-stone-400 truncate max-w-[140px]" title={student.token}>
                        {student.token.slice(0, 8)}…
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <span
                          title={`Module 1: ${student.m1 ? 'Completed' : 'Not completed'}`}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold ${
                            student.m1 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          M1
                        </span>
                        <span
                          title={`Module 2: ${student.m2 ? 'Completed' : 'Not completed'}`}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold ${
                            student.m2 ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          M2
                        </span>
                        <span
                          title={`Module 3: ${student.m3 ? 'Completed' : 'Not completed'}`}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold ${
                            student.m3 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          M3
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {student.bestTimeMs !== null ? (
                        <span className="font-mono font-bold text-teal-800">
                          {formatDuration(student.bestTimeMs)}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {student.bestQuizScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-stone-800">
                            {student.bestQuizScore}/5
                          </span>
                          {student.hasPassedQuiz ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-[10px] px-1.5 py-0">
                              Passed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-stone-500 text-[10px] px-1.5 py-0">
                              Retry
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-mono font-medium text-stone-700">
                        {student.totalRuns}
                      </span>
                      {student.totalRuns > 0 && (
                        <span className="ml-1 text-[11px] text-stone-400">
                          ({student.challengePercent}%)
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right text-xs text-stone-500">
                      {formatRelativeTime(student.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
