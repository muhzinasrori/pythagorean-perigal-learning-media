/**
 * Zod schemas for Phase 4 progress and analytics API.
 */
import { z } from 'zod'

// Strips control characters (ASCII 0-31 and 127) and trims
const sanitizeDisplayName = (val: string) =>
  val.replace(/[\x00-\x1F\x7F]/g, '').trim()

export const studentSchema = z.object({
  token: z.string().uuid(),
  displayName: z
    .string()
    .transform(sanitizeDisplayName)
    .pipe(z.string().max(24, 'Display name must be at most 24 characters'))
    .optional(),
})
export type StudentInput = z.infer<typeof studentSchema>

export const progressSchema = z.object({
  token: z.string().uuid(),
  module: z.enum(['m1', 'm2', 'm3']),
  stage: z.number().int().min(1).max(4).default(1),
  completed: z.boolean().default(false),
  extra: z
    .record(z.string(), z.unknown())
    .refine(
      (val) => JSON.stringify(val).length <= 2048,
      'Extra payload must be <= 2KB'
    )
    .optional(),
})
export type ProgressInput = z.infer<typeof progressSchema>

export const challengeRunSchema = z.object({
  token: z.string().uuid(),
  legA: z.number().int().min(1).max(30),
  legB: z.number().int().min(1).max(30),
  hypotenuse: z.number().positive(),
  durationMs: z.number().int().min(500).max(3_600_000),
  placedCount: z.number().int().min(0).max(5).default(5),
  usedAuto: z.boolean().default(false),
  challengeMode: z.boolean().default(false),
})
export type ChallengeRunInput = z.infer<typeof challengeRunSchema>

export const quizAttemptSchema = z.object({
  token: z.string().uuid(),
  score: z.number().int().min(0).max(5),
  total: z.number().int().default(5),
  answers: z.array(z.record(z.string(), z.unknown())).max(5),
  durationMs: z.number().int().min(0).optional(),
})
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>

export const tokenQuerySchema = z.object({
  token: z.string().uuid(),
})
export type TokenQuery = z.infer<typeof tokenQuerySchema>

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
})
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>

export const quizHistoryQuerySchema = z.object({
  token: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
export type QuizHistoryQuery = z.infer<typeof quizHistoryQuerySchema>
