/**
 * Comprehensive smoke test suite for Phase 4 API Route Handlers.
 * Tests happy paths, validation errors (400), not found (404), and responses.
 *
 * Run with: pnpm.cmd exec tsx scripts/test-api-smoke.ts
 */

// Stub 'server-only' so direct Node/tsx execution of server modules works
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
  body?: Record<string, unknown> | string
): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}

async function runSmokeTests() {
  // Dynamically import routes after server-only is stubbed
  const { POST: postStudent } = await import('../src/app/api/students/route')
  const { GET: getProgress, PUT: putProgress } = await import('../src/app/api/progress/route')
  const { POST: postChallengeRun } = await import('../src/app/api/challenge-runs/route')
  const { GET: getLeaderboard } = await import('../src/app/api/leaderboard/route')
  const { POST: postQuizAttempt, GET: getQuizAttempt } = await import('../src/app/api/quiz-attempts/route')

  console.log('🧪 Starting API smoke tests...\n')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✔ ${msg}`)
      passed++
    } else {
      console.error(`  ✖ FAIL: ${msg}`)
      failed++
    }
  }

  const testToken = 'a0000000-0000-4000-a000-000000000099'
  const unknownToken = 'a0000000-0000-4000-a000-000000000000'

  // 1. POST /api/students
  console.log('--- 1. POST /api/students ---')
  {
    // Happy path
    const req = createRequest('/api/students', 'POST', {
      token: testToken,
      displayName: 'Test Runner',
    })
    const res = await postStudent(req)
    const json = await res.json()
    assert(res.status === 200, `POST /api/students status 200 (got ${res.status})`)
    assert(json.token === testToken, `Student token matches: ${json.token}`)
    assert(json.displayName === 'Test Runner', `Display name matches: ${json.displayName}`)

    // Invalid token (not UUID)
    const reqInvalid = createRequest('/api/students', 'POST', {
      token: 'not-a-uuid',
      displayName: 'Bad Token',
    })
    const resInvalid = await postStudent(reqInvalid)
    assert(resInvalid.status === 400, `Invalid token returns 400 (got ${resInvalid.status})`)

    // Invalid JSON body
    const reqBadJson = createRequest('/api/students', 'POST', '{invalid-json')
    const resBadJson = await postStudent(reqBadJson)
    assert(resBadJson.status === 400, `Malformed JSON returns 400 (got ${resBadJson.status})`)
  }

  // 2. PUT & GET /api/progress
  console.log('\n--- 2. /api/progress (GET & PUT) ---')
  {
    // PUT progress
    const putReq = createRequest('/api/progress', 'PUT', {
      token: testToken,
      module: 'm2',
      stage: 3,
      completed: true,
      extra: { legs: [6, 8], cutAngle: 126.87 },
    })
    const putRes = await putProgress(putReq)
    const putJson = await putRes.json()
    assert(putRes.status === 200, `PUT /api/progress status 200 (got ${putRes.status})`)
    assert(putJson.module === 'm2', `Progress module is m2`)
    assert(putJson.stage === 3, `Progress stage is 3`)
    assert(putJson.completed === true, `Progress completed is true`)

    // GET progress
    const getReq = createRequest(`/api/progress?token=${testToken}`, 'GET')
    const getRes = await getProgress(getReq)
    const getJson = await getRes.json()
    assert(getRes.status === 200, `GET /api/progress status 200 (got ${getRes.status})`)
    assert(Array.isArray(getJson) && getJson.length >= 1, `Returns progress array (length ${getJson.length})`)

    // GET with unknown student
    const getUnknown = createRequest(`/api/progress?token=${unknownToken}`, 'GET')
    const getUnknownRes = await getProgress(getUnknown)
    assert(getUnknownRes.status === 404, `Unknown student GET progress returns 404 (got ${getUnknownRes.status})`)

    // GET with invalid token
    const getBad = createRequest(`/api/progress?token=bad-token`, 'GET')
    const getBadRes = await getProgress(getBad)
    assert(getBadRes.status === 400, `Invalid token GET progress returns 400 (got ${getBadRes.status})`)
  }

  // 3. POST /api/challenge-runs
  console.log('\n--- 3. POST /api/challenge-runs ---')
  {
    // Happy path run
    const req = createRequest('/api/challenge-runs', 'POST', {
      token: testToken,
      legA: 3,
      legB: 4,
      hypotenuse: 5,
      durationMs: 16400,
      placedCount: 5,
      usedAuto: false,
      challengeMode: false,
    })
    const res = await postChallengeRun(req)
    const json = await res.json()
    assert(res.status === 201, `POST /api/challenge-runs status 201 (got ${res.status})`)
    assert(json.run.durationMs === 16400, `Run duration recorded: ${json.run.durationMs}`)
    assert(typeof json.rank === 'number' && json.rank >= 1, `Rank computed: ${json.rank}`)

    // Run with usedAuto = true -> rank should be null
    const reqAuto = createRequest('/api/challenge-runs', 'POST', {
      token: testToken,
      legA: 3,
      legB: 4,
      hypotenuse: 5,
      durationMs: 9000,
      placedCount: 5,
      usedAuto: true,
      challengeMode: false,
    })
    const resAuto = await postChallengeRun(reqAuto)
    const jsonAuto = await resAuto.json()
    assert(resAuto.status === 201, `Assisted run status 201`)
    assert(jsonAuto.rank === null, `Assisted run has null leaderboard rank`)

    // Unknown student
    const reqUnknown = createRequest('/api/challenge-runs', 'POST', {
      token: unknownToken,
      legA: 3,
      legB: 4,
      hypotenuse: 5,
      durationMs: 20000,
      placedCount: 5,
    })
    const resUnknown = await postChallengeRun(reqUnknown)
    assert(resUnknown.status === 404, `Unknown student returns 404 (got ${resUnknown.status})`)
  }

  // 4. GET /api/leaderboard
  console.log('\n--- 4. GET /api/leaderboard ---')
  {
    const req = createRequest('/api/leaderboard?limit=5', 'GET')
    const res = await getLeaderboard(req)
    const json = await res.json()
    assert(res.status === 200, `GET /api/leaderboard status 200 (got ${res.status})`)
    assert(Array.isArray(json), `Leaderboard is an array`)
    assert(json.length > 0, `Leaderboard has entries (${json.length})`)
    assert(json[0].rank === 1, `First entry rank is 1`)
    assert(typeof json[0].durationMs === 'number', `DurationMs is number (${json[0].durationMs})`)
    assert(typeof json[0].displayName === 'string', `DisplayName present: ${json[0].displayName}`)
  }

  // 5. POST & GET /api/quiz-attempts
  console.log('\n--- 5. /api/quiz-attempts (POST & GET) ---')
  {
    // POST passing quiz attempt
    const postReq = createRequest('/api/quiz-attempts', 'POST', {
      token: testToken,
      score: 4,
      total: 5,
      answers: [
        { questionId: 1, correct: true },
        { questionId: 2, correct: true },
        { questionId: 3, correct: true },
        { questionId: 4, correct: true },
        { questionId: 5, correct: false },
      ],
      durationMs: 38000,
    })
    const postRes = await postQuizAttempt(postReq)
    const postJson = await postRes.json()
    assert(postRes.status === 201, `POST /api/quiz-attempts status 201 (got ${postRes.status})`)
    assert(postJson.attempt.passed === true, `Score 4/5 marked as passed = true`)
    assert(postJson.personalBest !== null, `Personal best returned`)

    // POST failing quiz attempt
    const postFailReq = createRequest('/api/quiz-attempts', 'POST', {
      token: testToken,
      score: 2,
      total: 5,
      answers: [{ questionId: 1, correct: false }],
      durationMs: 25000,
    })
    const postFailRes = await postQuizAttempt(postFailReq)
    const postFailJson = await postFailRes.json()
    assert(postFailJson.attempt.passed === false, `Score 2/5 marked as passed = false`)

    // GET quiz history
    const getReq = createRequest(`/api/quiz-attempts?token=${testToken}&limit=10`, 'GET')
    const getRes = await getQuizAttempt(getReq)
    const getJson = await getRes.json()
    assert(getRes.status === 200, `GET /api/quiz-attempts status 200 (got ${getRes.status})`)
    assert(Array.isArray(getJson) && getJson.length >= 2, `Returns attempt history (found ${getJson.length})`)

    // GET unknown student
    const getUnknown = createRequest(`/api/quiz-attempts?token=${unknownToken}`, 'GET')
    const getUnknownRes = await getQuizAttempt(getUnknown)
    assert(getUnknownRes.status === 404, `Unknown student GET quiz-attempts returns 404 (got ${getUnknownRes.status})`)
  }

  console.log(`\n========================================`)
  console.log(`Summary: ${passed} passed, ${failed} failed`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
