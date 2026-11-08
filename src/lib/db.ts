/**
 * Prisma singleton — safe for Next.js hot-reload in development.
 *
 * Import this module only from Server Components, Route Handlers, and
 * Server Actions. Never import it in client-side code.
 */
import 'server-only'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

/**
 * Resolves a reliable absolute SQLite path across Next.js dev, start, and standalone mode.
 */
function getDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL
  if (!envUrl) return undefined

  if (envUrl.startsWith('file:')) {
    const rawPath = envUrl.slice(5)
    if (path.isAbsolute(rawPath) && fs.existsSync(/*turbopackIgnore: true*/ rawPath)) {
      return `file:${rawPath.replace(/\\/g, '/')}`
    }

    const candidates = [
      path.resolve(process.cwd(), 'db/custom.db'),
      path.resolve(process.cwd(), '../db/custom.db'),
      path.resolve(process.cwd(), '../../db/custom.db'),
      path.resolve(/*turbopackIgnore: true*/ process.cwd(), rawPath),
      path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'prisma', rawPath),
    ]

    for (const candidate of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
        return `file:${candidate.replace(/\\/g, '/')}`
      }
    }
  }

  return envUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const resolvedDbUrl = getDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDbUrl ? { datasources: { db: { url: resolvedDbUrl } } } : {}),
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db