/**
 * POST /api/quiz-attempts
 * GET  /api/quiz-attempts?token=...&limit=20
 *
 * Records quiz attempts, calculates pass status server-side (score >= 4),
 * and provides student attempt history and personal best.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  quizAttemptSchema,
  quizHistoryQuerySchema,
} from '@/lib/validation/progress'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = quizAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    )
  }

  const { token, score, total, answers, durationMs } = parsed.data
  // Server recomputes pass criteria: score >= 4 out of 5 (80%)
  const passed = score >= 4

  try {
    const student = await db.student.findUnique({
      where: { token },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const attempt = await db.quizAttempt.create({
      data: {
        studentId: student.id,
        score,
        total,
        passed,
        answers: answers as Prisma.InputJsonValue,
        durationMs: durationMs ?? null,
      },
    })

    // Compute personal best score for this student
    const bestAttempt = await db.quizAttempt.findFirst({
      where: { studentId: student.id },
      orderBy: [{ score: 'desc' }, { durationMs: 'asc' }],
      select: {
        score: true,
        total: true,
        passed: true,
        durationMs: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        attempt,
        personalBest: bestAttempt,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('Database error in POST /api/quiz-attempts:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = quizHistoryQuerySchema.safeParse({
    token: searchParams.get('token') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid query parameters' },
      { status: 400 }
    )
  }

  const { token, limit } = parsed.data

  try {
    const student = await db.student.findUnique({
      where: { token },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const attempts = await db.quizAttempt.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(attempts, { status: 200 })
  } catch (err: unknown) {
    console.error('Database error in GET /api/quiz-attempts:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}
