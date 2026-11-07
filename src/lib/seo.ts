/**
 * Central SEO configuration — the single source of truth for page metadata,
 * structured data (JSON-LD) and the visible FAQ section.
 *
 * The canonical production URL can be overridden per environment via
 * NEXT_PUBLIC_SITE_URL (set it in .env or in the Vercel project settings),
 * so the site can move to a custom domain by changing ONE variable.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://pythagorean-perigal-learning-media.vercel.app'
).replace(/\/+$/, '');

export const SITE_NAME = 'Pythagorean Learning Media';

/** Default <title> — kept ≤ 60 characters, primary keyword first. */
export const SITE_TITLE = "Pythagorean Learning Media — Perigal's Dissection";

/** ~155 characters, benefit-led, contains the primary keyword. */
export const SITE_DESCRIPTION =
  "Discover a² + b² = c² hands-on: explore areas, cut Perigal's 4-piece dissection, drag the pieces, and ace the quiz. Free interactive Grade 8 math media.";

export const SITE_KEYWORDS = [
  'Pythagorean theorem',
  "Perigal's dissection",
  'Perigal dissection proof',
  'Pythagoras theorem interactive',
  'grade 8 math',
  'a2 + b2 = c2',
  'right triangle',
  'geometry learning media',
  'guided discovery learning',
  'interactive math activity',
] as const;

export const SITE_AUTHOR = 'Muhzinul Asrori';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQ — used BOTH by the visible accordion on the landing view AND by the
 * FAQPage JSON-LD. The two MUST stay identical, so only edit it here.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is the Pythagorean Theorem?',
    answer:
      'In any right-angled triangle, the area of the square drawn on the hypotenuse equals the sum of the areas of the squares on the two legs: a² + b² = c². It is a core topic of Grade 8 mathematics.',
  },
  {
    question: "What is Perigal's dissection?",
    answer:
      'A visual proof published by Henry Perigal in 1836. Two perpendicular lines through the centre of the square on the longer leg — one of them parallel to the hypotenuse — cut it into four congruent pieces. Those four pieces, together with the square on the shorter leg, exactly fill the square on the hypotenuse.',
  },
  {
    question: 'Who is this learning media for?',
    answer:
      'Grade 8 students (around ages 13–14) who are learning the Pythagorean Theorem, and teachers who want interactive guided-discovery media for the classroom — including a teacher dashboard with class analytics.',
  },
  {
    question: 'How long does a complete lesson take?',
    answer:
      'About 40 minutes: Module 1 — Areas & Triples (10 minutes), Module 2 — Perigal Studio (20 minutes, the heart of the lesson) and Module 3 — Challenge & Quiz (10 minutes).',
  },
  {
    question: 'Does it work on tablets and phones?',
    answer:
      'Yes. The puzzle boards support both touch and mouse (pointer events), the sliders are keyboard-operable, and an auto-assemble option offers a no-drag alternative. The layout adapts to small screens.',
  },
  {
    question: 'Is it free? Do I need an account?',
    answer:
      'It is 100% free and needs no account. Progress is saved on your device and syncs in the background when the server is available.',
  },
];

/**
 * Structured data injected into every page as JSON-LD (@graph).
 * - WebApplication + LearningResource → who it is for, what it teaches, free.
 * - FAQPage → eligible for Google FAQ rich results (matches the visible FAQ).
 */
export function buildJsonLd(): Record<string, unknown> {
  const appUrl = `${SITE_URL}/`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebApplication', 'LearningResource'],
        '@id': `${appUrl}#app`,
        name: `${SITE_NAME} — Perigal's Dissection`,
        alternateName: SITE_NAME,
        url: appUrl,
        description: SITE_DESCRIPTION,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any (web browser)',
        browserRequirements: 'Requires JavaScript. Works on desktop, tablet and mobile.',
        isAccessibleForFree: true,
        inLanguage: 'en',
        educationalLevel: 'Grade 8',
        typicalAgeRange: '13-14',
        learningResourceType: 'Interactive learning media',
        teaches:
          "The Pythagorean Theorem (a² + b² = c²) through Henry Perigal's dissection proof",
        keywords: SITE_KEYWORDS.join(', '),
        author: { '@id': `${appUrl}#author` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'Module 1 — Areas & Triples: interactive square-area explorer with leg sliders',
          'Module 2 — Perigal Studio: 4-stage cut-and-assemble dissection proof',
          'Module 3 — Speed Challenge and 5-question concept quiz with instant feedback',
          'Teacher dashboard with real-time class analytics and CSV export',
        ],
      },
      {
        '@type': 'Person',
        '@id': `${appUrl}#author`,
        name: SITE_AUTHOR,
      },
      {
        '@type': 'FAQPage',
        '@id': `${appUrl}#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}
