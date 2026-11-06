/**
 * POST /api/students
 *
 * Upsert a student profile by client-provided UUID capability token.
 * Security:
 * - Token is treated as a capability key (no passwords).
 * - Display name is optional, sanitized, and capped at 24 chars (no PII).
 * - DB errors return 503 without leaking stack traces.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { studentSchema } from '@/lib/validation/progress'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = studentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Validation failed' },
      { status: 400 }
    )
  }

  const { token, displayName } = parsed.data

  try {
    const student = await db.student.upsert({
      where: { token },
      create: {
        token,
        displayName: displayName ?? null,
      },
      update: {
        ...(displayName !== undefined ? { displayName } : {}),
      },
      select: {
        id: true,
        token: true,
        displayName: true,
      },
    })

    return NextResponse.json(student, { status: 200 })
  } catch (err: unknown) {
    console.error('Database error in POST /api/students:', err)
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }
}
