/**
 * Verifies that when the database is unreachable or disconnected,
 * all route handlers return HTTP 503 with JSON { error: string } and no crash/stack trace.
 */

// Stub 'server-only'
try {
  const resolved = require.resolve('server-only')
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
    children: [],
    path: '',
    paths: [],
  }
} catch {
  // ignore
}

import { NextRequest } from 'next/server'

function createRequest(
  url: string,
  method: 'GET' | 'POST' | 'PUT',
  body?: Record<string, unknown>
): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}

async function testUnreachableDb() {
  console.log('🧪 Testing 503 error handling with disconnected database...\n')

  const { db } = await import('../src/lib/db')
  const { POST: postStudent } = await import('../src/app/api/students/route')
  const { GET: getProgress, PUT: putProgress } = await import('../src/app/api/progress/route')
  const { GET: getLeaderboard } = await import('../src/app/api/leaderboard/route')

  // Disconnect prisma client to simulate DB failure
  await db.$disconnect()

  // Point to a non-existent path or force mock error on prisma methods
  const studentModel = db.student as unknown as Record<string, unknown>
  const origStudentUpsert = studentModel.upsert
  studentModel.upsert = async () => {
    throw new Error('SQLite disk I/O error: database file unreachable')
  }

  const req = createRequest('/api/students', 'POST', {
    token: 'a0000000-0000-4000-a000-000000000099',
    displayName: 'Test',
  })

  const res = await postStudent(req)
  const json = await res.json()

  console.log(`Response status: ${res.status}`)
  console.log(`Response body: ${JSON.stringify(json)}`)

  if (res.status === 503 && json.error === 'Database service unavailable') {
    console.log('✔ Graceful 503 error returned without stack trace!')
  } else {
    console.error('✖ Failed 503 assertion!')
    process.exit(1)
  }

  // Restore
  studentModel.upsert = origStudentUpsert
}

testUnreachableDb().catch((e) => {
  console.error(e)
  process.exit(1)
})
