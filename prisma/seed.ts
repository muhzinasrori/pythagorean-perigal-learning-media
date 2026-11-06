/**
 * Idempotent seed script for Pythagorean Learning Media.
 * Populates 3 demo students with module progress, challenge runs, and quiz attempts.
 *
 * Run with: pnpm run db:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_STUDENTS = [
  {
    token: '11111111-1111-4111-8111-111111111111',
    displayName: 'Alya (Demo)',
  },
  {
    token: '22222222-2222-4222-8222-222222222222',
    displayName: 'Budi (Demo)',
  },
  {
    token: '33333333-3333-4333-8333-333333333333',
    displayName: 'Citra (Demo)',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const demo of DEMO_STUDENTS) {
    const student = await prisma.student.upsert({
      where: { token: demo.token },
      create: {
        token: demo.token,
        displayName: demo.displayName,
      },
      update: {
        displayName: demo.displayName,
      },
    })
    console.log(`✓ Student: ${student.displayName} (${student.token})`)

    // Seed module progresses
    await prisma.moduleProgress.upsert({
      where: {
        studentId_module: {
          studentId: student.id,
          module: 'm1',
        },
      },
      create: {
        studentId: student.id,
        module: 'm1',
        stage: 1,
        completed: true,
        extra: { triple: [3, 4, 5] },
      },
      update: {
        completed: true,
      },
    })

    await prisma.moduleProgress.upsert({
      where: {
        studentId_module: {
          studentId: student.id,
          module: 'm2',
        },
      },
      create: {
        studentId: student.id,
        module: 'm2',
        stage: 4,
        completed: true,
        extra: { legs: [3, 4], cutAngle: 53.13, challengeMode: false },
      },
      update: {
        stage: 4,
        completed: true,
      },
    })
  }

  // Create Challenge Runs for students if not already present
  const alya = await prisma.student.findUniqueOrThrow({
    where: { token: DEMO_STUDENTS[0].token },
  })
  const budi = await prisma.student.findUniqueOrThrow({
    where: { token: DEMO_STUDENTS[1].token },
  })
  const citra = await prisma.student.findUniqueOrThrow({
    where: { token: DEMO_STUDENTS[2].token },
  })

  const alyaRuns = await prisma.challengeRun.count({ where: { studentId: alya.id } })
  if (alyaRuns === 0) {
    await prisma.challengeRun.createMany({
      data: [
        {
          studentId: alya.id,
          legA: 3,
          legB: 4,
          hypotenuse: 5,
          durationMs: 14500,
          placedCount: 5,
          usedAuto: false,
          challengeMode: false,
        },
        {
          studentId: alya.id,
          legA: 5,
          legB: 12,
          hypotenuse: 13,
          durationMs: 22000,
          placedCount: 5,
          usedAuto: false,
          challengeMode: true,
        },
      ],
    })
  }

  const budiRuns = await prisma.challengeRun.count({ where: { studentId: budi.id } })
  if (budiRuns === 0) {
    await prisma.challengeRun.create({
      data: {
        studentId: budi.id,
        legA: 3,
        legB: 4,
        hypotenuse: 5,
        durationMs: 18200,
        placedCount: 5,
        usedAuto: false,
        challengeMode: false,
      },
    })
  }

  const citraRuns = await prisma.challengeRun.count({ where: { studentId: citra.id } })
  if (citraRuns === 0) {
    await prisma.challengeRun.create({
      data: {
        studentId: citra.id,
        legA: 3,
        legB: 4,
        hypotenuse: 5,
        durationMs: 31000,
        placedCount: 5,
        usedAuto: true, // used auto helper
        challengeMode: false,
      },
    })
  }

  // Seed Quiz Attempts
  const alyaAttempts = await prisma.quizAttempt.count({ where: { studentId: alya.id } })
  if (alyaAttempts === 0) {
    await prisma.quizAttempt.create({
      data: {
        studentId: alya.id,
        score: 5,
        total: 5,
        passed: true,
        answers: [
          { questionId: 1, choice: 0, correct: true },
          { questionId: 2, choice: 2, correct: true },
          { questionId: 3, choice: 1, correct: true },
          { questionId: 4, choice: 3, correct: true },
          { questionId: 5, choice: 0, correct: true },
        ],
        durationMs: 45000,
      },
    })
  }

  const budiAttempts = await prisma.quizAttempt.count({ where: { studentId: budi.id } })
  if (budiAttempts === 0) {
    await prisma.quizAttempt.create({
      data: {
        studentId: budi.id,
        score: 3,
        total: 5,
        passed: false,
        answers: [
          { questionId: 1, choice: 0, correct: true },
          { questionId: 2, choice: 1, correct: false },
          { questionId: 3, choice: 1, correct: true },
          { questionId: 4, choice: 2, correct: false },
          { questionId: 5, choice: 0, correct: true },
        ],
        durationMs: 62000,
      },
    })
  }

  console.log('✅ Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
