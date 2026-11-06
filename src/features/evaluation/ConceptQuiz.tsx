'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QUIZ_QUESTIONS, PASS_SCORE } from './quizData';
import { cn } from '@/lib/utils';
import { getStudentToken } from '@/features/progress/identity';
import { syncProgress, syncQuizAttempt } from '@/features/progress/sync';

type Phase = 'answering' | 'feedback' | 'summary';

export function ConceptQuiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [attempt, setAttempt] = useState(1);
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: number; choice: number; correct: boolean }>>([]);
  const startTimeRef = useRef<number>(Date.now());

  const q = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;
  const isLast = index === total - 1;
  const passed = score >= PASS_SCORE;

  const choose = (i: number) => {
    if (phase !== 'answering') return;
    setSelected(i);
    setPhase('feedback');
    const isCorrect = i === q.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setUserAnswers((prev) => [...prev, { questionId: q.id, choice: i, correct: isCorrect }]);
  };

  const next = () => {
    if (isLast) {
      setPhase('summary');
      const token = getStudentToken();
      const isPassed = score >= PASS_SCORE;
      const durationMs = Date.now() - startTimeRef.current;
      syncQuizAttempt({
        token,
        score,
        total,
        answers: userAnswers,
        durationMs,
      });
      syncProgress({
        token,
        module: 'm3',
        stage: 2,
        completed: isPassed,
      });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setPhase('answering');
    }
  };

  const retry = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setUserAnswers([]);
    startTimeRef.current = Date.now();
    setPhase('answering');
    setAttempt((a) => a + 1);
  };

  if (phase === 'summary') {
    return (
      <motion.div
        key={`summary-${attempt}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-xl"
      >
        <Card
          className={cn(
            'rounded-3xl border-2 shadow-lg',
            passed ? 'border-emerald-400 bg-emerald-50' : 'border-amber-400 bg-amber-50',
          )}
        >
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-5xl">{passed ? '🏆' : '💪'}</p>
            <h2 className={cn('text-2xl font-extrabold', passed ? 'text-emerald-800' : 'text-amber-800')}>
              {passed ? 'Quiz passed!' : 'Almost there!'}
            </h2>
            <p className="font-mono text-4xl font-extrabold text-stone-800">
              {score} / {total}
            </p>
            <p className="text-sm leading-relaxed text-stone-600">
              {passed
                ? 'You truly understand why a² + b² = c² — from areas to the perfect dissection. Excellent work, mathematician!'
                : `You need ${PASS_SCORE} out of ${total} to pass. Revisit Modules 1 and 2 — especially what happens when the cut is not parallel to the hypotenuse — then try again.`}
            </p>
            <Button
              onClick={retry}
              className="min-h-12 gap-2 rounded-xl bg-teal-700 px-6 text-base hover:bg-teal-800"
            >
              <RotateCcw className="h-4 w-4" /> Retake the quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={((index + (phase === 'feedback' ? 1 : 0)) / total) * 100} className="h-2.5" />
        <span className="shrink-0 font-mono text-sm font-bold text-stone-500">
          {index + 1}/{total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${attempt}-${q.id}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          <Card className="rounded-2xl border-stone-200">
            <CardContent className="space-y-5 p-6">
              <h2 className="text-lg font-bold leading-relaxed text-stone-900">{q.question}</h2>

              <div className="grid gap-2.5" role="group" aria-label="Answer options">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isChosen = i === selected;
                  const reveal = phase === 'feedback';
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      disabled={reveal}
                      aria-pressed={isChosen}
                      className={cn(
                        'flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-colors',
                        !reveal &&
                          'border-stone-200 bg-white hover:border-teal-500 hover:bg-teal-50/60',
                        reveal && isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                        reveal && isChosen && !isCorrect && 'border-rose-400 bg-rose-50 text-rose-900',
                        reveal && !isCorrect && !isChosen && 'border-stone-200 bg-white opacity-55',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-sm font-bold',
                          reveal && isCorrect
                            ? 'bg-emerald-500 text-white'
                            : reveal && isChosen
                              ? 'bg-rose-500 text-white'
                              : 'bg-stone-100 text-stone-600',
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {reveal && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                      {reveal && isChosen && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {phase === 'feedback' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'rounded-xl p-4',
                      selected === q.correctIndex ? 'bg-emerald-50' : 'bg-amber-50',
                    )}
                  >
                    <p
                      className={cn(
                        'mb-1 text-sm font-extrabold',
                        selected === q.correctIndex ? 'text-emerald-800' : 'text-amber-800',
                      )}
                    >
                      {selected === q.correctIndex ? 'Correct!' : 'Not quite…'}
                    </p>
                    <p className="text-sm leading-relaxed text-stone-700">{q.explanation}</p>
                    <Button
                      onClick={next}
                      className="mt-3 min-h-11 gap-2 rounded-xl bg-teal-700 hover:bg-teal-800"
                    >
                      {isLast ? 'See my score' : 'Next question'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
