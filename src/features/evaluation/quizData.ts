export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Formative concept quiz — every answer is discoverable in Modules 1 & 2. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question:
      'In Perigal\'s dissection, the square on the LONGER leg is cut into how many pieces?',
    options: ['2 pieces', '3 pieces', '4 pieces', '6 pieces'],
    correctIndex: 2,
    explanation:
      'Two perpendicular lines through the centre O divide square b² into 4 congruent quadrilaterals.',
  },
  {
    id: 2,
    question: 'The two cutting lines always pass through…',
    options: [
      'a corner of the square',
      'the centre of the square',
      'the midpoint of one side',
      'anywhere you like',
    ],
    correctIndex: 1,
    explanation:
      'Both cutting lines pass through the centre O — the point where the two diagonals of the square meet.',
  },
  {
    id: 3,
    question: 'For the 4 pieces to fit PERFECTLY into the square on the hypotenuse, the cut must be…',
    options: [
      'vertical and horizontal',
      'at exactly 45°',
      'parallel and perpendicular to the hypotenuse',
      'any angle works fine',
    ],
    correctIndex: 2,
    explanation:
      'One cutting line must be parallel to the hypotenuse c (the other is then automatically perpendicular). That is the magic condition!',
  },
  {
    id: 4,
    question: 'A right triangle has legs a = 6 and b = 8. What is the hypotenuse c?',
    options: ['c = 10', 'c = 12', 'c = 14', 'c = 48'],
    correctIndex: 0,
    explanation:
      'a² + b² = 36 + 64 = 100, and √100 = 10. (This is just the 3-4-5 triple scaled by 2.)',
  },
  {
    id: 5,
    question:
      'You cut b² at the WRONG angle and try to fill the hypotenuse square. What happens?',
    options: [
      'The pieces fit, but the puzzle takes longer',
      'The pieces leave gaps or overlap — they can never fill c² exactly',
      'The computer fixes the angle automatically',
      'The pieces become triangles',
    ],
    correctIndex: 1,
    explanation:
      'Only cuts parallel to the hypotenuse produce piece shapes that match the corners of c². Wrong angle → gaps and overlaps, as you saw in the studio!',
  },
];

export const PASS_SCORE = 4;
