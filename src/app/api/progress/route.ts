/**
 * GET /api/progress?token=...
 * PUT /api/progress
 *
 * Progress persistence for modules m1, m2, m3.
 * Security:
 * - Token is required and validated as UUID.
 * - Stage is clamped server-side (m1/m3 max 4, m2 max 4).
 * - DB errors return 503 without leaking stack traces.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { progressSchema, tokenQuerySchema } from '@/lib/validation/progress'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

const MAX_STAGES: Record<string, number> = {
  m1: 4,
  m2: 4,
  m3: 4,
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = tokenQuerySchema.safeParse({ token: searchParams.get('token') })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid or missing token parameter' },
      { status: 400 }
    )
  }

  try {
    const student = await db.student.findUnique({
      where: { token: parsed.data.token },
      include: { progresses: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student.progresses, { status: 200 })
  } catch (err: unknown) {
    console.error('Database error in GET /api/progress:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}

export async function PUT(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = progressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    )
  }

  const { token, module, stage, completed, extra } = parsed.data
  const maxStage = MAX_STAGES[module] ?? 4
  const clampedStage = Math.max(1, Math.min(stage, maxStage))

  try {
    const student = await db.student.findUnique({
      where: { token },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const row = await db.moduleProgress.upsert({
      where: {
        studentId_module: {
          studentId: student.id,
          module,
        },
      },
      create: {
        studentId: student.id,
        module,
        stage: clampedStage,
        completed,
        extra: (extra as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
      update: {
        stage: clampedStage,
        completed,
        extra: (extra as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    })

    return NextResponse.json(row, { status: 200 })
  } catch (err: unknown) {
    console.error('Database error in PUT /api/progress:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}
