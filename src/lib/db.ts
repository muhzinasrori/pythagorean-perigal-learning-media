/**
 * Prisma singleton — safe for Next.js hot-reload in development.
 *
 * Import this module only from Server Components, Route Handlers, and
 * Server Actions. Never import it in client-side code.
 */
import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db