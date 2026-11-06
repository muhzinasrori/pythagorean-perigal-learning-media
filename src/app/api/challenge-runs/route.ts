/**
 * POST /api/challenge-runs
 *
 * Records a challenge run and computes the student's rank.
 * Valid leaderboard runs must have placedCount === 5 and usedAuto === false.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { challengeRunSchema } from '@/lib/validation/progress'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = challengeRunSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    )
  }

  const {
    token,
    legA,
    legB,
    hypotenuse,
    durationMs,
    placedCount,
    usedAuto,
    challengeMode,
  } = parsed.data

  try {
    const student = await db.student.findUnique({
      where: { token },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const run = await db.challengeRun.create({
      data: {
        studentId: student.id,
        legA,
        legB,
        hypotenuse,
        durationMs,
        placedCount,
        usedAuto,
        challengeMode,
      },
    })

    let rank: number | null = null
    // Rank is only computed for valid, unaided, fully placed runs
    if (placedCount === 5 && !usedAuto) {
      const betterRunsCount = await db.challengeRun.count({
        where: {
          placedCount: 5,
          usedAuto: false,
          OR: [
            { durationMs: { lt: durationMs } },
            {
              durationMs,
              createdAt: { lt: run.createdAt },
            },
          ],
        },
      })
      rank = betterRunsCount + 1
    }

    return NextResponse.json({ run, rank }, { status: 201 })
  } catch (err: unknown) {
    console.error('Database error in POST /api/challenge-runs:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}
