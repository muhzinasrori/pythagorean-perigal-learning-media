'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ViewId } from './LearningApp';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: ViewId;
}

const HELP: Record<ViewId, { title: string; steps: string[] }> = {
  landing: {
    title: 'Welcome to Pythagoras Lab',
    steps: [
      'This media teaches the Pythagorean Theorem — a² + b² = c² — through Henry Perigal\'s famous visual "dissection" proof.',
      'Follow the three modules in order: understand areas, build the dissection yourself, then test your skills.',
      'Everything works with a mouse or your fingers on a tablet. Use the footer buttons to move between modules.',
    ],
  },
  m1: {
    title: 'Help — Module 1: Areas & Triples',
    steps: [
      'Drag the sliders to change legs a (amber) and b (teal). The squares redraw live.',
      'Watch the area numbers: does a² + b² always equal c² (rose)?',
      'Tap a triple chip (3-4-5, 5-12-13, …) to load a Pythagorean triple instantly.',
      'Mission: find two different triangles where a² + b² = c² uses whole numbers.',
    ],
  },
  m2: {
    title: 'Help — Module 2: Perigal Studio',
    steps: [
      'Step 1 — draw both diagonals of square b² to reveal its centre point O.',
      'Step 2 — rotate the cutting lines with the slider. In Magnet Mode the lines lock (green) when they become parallel to the hypotenuse c. Free Mode lets you cut at any angle — but the puzzle may never fit!',
      'Step 3 — press CUT NOW to slice square b² into 4 pieces.',
      'Step 4 — drag the 4 pieces and the amber a² square into the dashed c² frame. Pieces snap when they are close to the right spot. If they don\'t fit, your cut angle was wrong — go back to Step 2!',
    ],
  },
  m3: {
    title: 'Help — Module 3: Challenge & Quiz',
    steps: [
      'Speed Challenge: assemble a randomly generated Perigal puzzle as fast as you can. The timer starts when you grab the first piece. Your best time is saved on this device.',
      'Concept Quiz: 5 multiple-choice questions with instant feedback and explanations. You need 4/5 to pass — retake it as often as you like.',
      'Tip: everything the quiz asks was discovered in Modules 1 and 2.',
    ],
  },
};

export function HelpDialog({ open, onOpenChange, topic }: HelpDialogProps) {
  const help = HELP[topic];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl" role="dialog" aria-labelledby="help-title">
        <DialogHeader>
          <DialogTitle id="help-title" className="text-lg font-bold text-teal-900">
            {help.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-stone-500">
            Quick guide for students and teachers.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2.5 pl-5 text-[15px] leading-relaxed text-stone-700">
          {help.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
