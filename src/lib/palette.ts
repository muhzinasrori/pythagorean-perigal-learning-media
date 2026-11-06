/**
 * Single source of truth for the color-coded squares used across every module.
 * a² = amber, b² = teal, c² = rose — consistency is the pedagogical anchor.
 */

export const PALETTE = {
  a: {
    fill: '#fbbf24', // amber-400
    fillSoft: '#fde68a', // amber-200
    stroke: '#d97706', // amber-600
    text: '#78350f', // amber-900
    chip: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  b: {
    fill: '#14b8a6', // teal-500
    fillSoft: '#99f6e4', // teal-200
    stroke: '#0f766e', // teal-700
    text: '#134e4a', // teal-900
    chip: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  c: {
    fill: '#fb7185', // rose-400
    fillSoft: '#fecdd3', // rose-200
    stroke: '#e11d48', // rose-600
    text: '#881337', // rose-900
    chip: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  triangle: {
    fill: '#e7e5e4', // stone-200
    stroke: '#44403c', // stone-700
  },
  ink: '#1c1917', // stone-900
  guide: '#a8a29e', // stone-400
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
} as const;

/** Teal shades for the 4 dissected pieces of b² (lightest → darkest). */
export const PIECE_SHADES: string[] = ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488'];

export const PIECE_STROKES: string[] = ['#0f766e', '#0f766e', '#134e4a', '#134e4a'];
