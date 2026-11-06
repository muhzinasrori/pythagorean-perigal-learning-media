/**
 * GET /api/leaderboard?limit=10
 *
 * Public leaderboard of top valid runs (placedCount === 5, usedAuto === false),
 * sorted by durationMs ascending.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaderboardQuerySchema } from '@/lib/validation/progress'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = leaderboardQuerySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid limit parameter' },
      { status: 400 }
    )
  }

  try {
    const runs = await db.challengeRun.findMany({
      where: {
        placedCount: 5,
        usedAuto: false,
      },
      orderBy: [{ durationMs: 'asc' }, { createdAt: 'asc' }],
      take: parsed.data.limit,
      select: {
        id: true,
        durationMs: true,
        legA: true,
        legB: true,
        hypotenuse: true,
        challengeMode: true,
        createdAt: true,
        student: {
          select: {
            displayName: true,
          },
        },
      },
    })

    const leaderboard = runs.map((run, index) => ({
      rank: index + 1,
      id: run.id,
      displayName: run.student.displayName ?? 'Anonymous',
      durationMs: run.durationMs,
      legA: run.legA,
      legB: run.legB,
      hypotenuse: run.hypotenuse,
      challengeMode: run.challengeMode,
      createdAt: run.createdAt,
    }))

    return NextResponse.json(leaderboard, { status: 200 })
  } catch (err: unknown) {
    console.error('Database error in GET /api/leaderboard:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}
