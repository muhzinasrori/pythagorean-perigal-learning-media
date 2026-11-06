'use client';

import { RotateCcw, RotateCw, FlipHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieceId } from '@/lib/geometry/perigal';

interface PieceControlsProps {
  pieceId: PieceId;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onFlip: () => void;
  onDeselect: () => void;
  position?: { x: number; y: number };
}

export function PieceControls({
  pieceId,
  onRotateCW,
  onRotateCCW,
  onFlip,
  onDeselect,
  position,
}: PieceControlsProps) {
  const label = pieceId === 'a' ? 'Piece a²' : `Piece ${pieceId.slice(1)}`;

  const style = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -120%)',
      }
    : undefined;

  return (
    <div
      role="toolbar"
      aria-label={`Controls for ${label}`}
      style={style}
      className={`z-30 flex items-center gap-1 rounded-2xl border border-stone-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md transition-all duration-150 ${
        position ? 'absolute' : 'relative inline-flex'
      }`}
    >
      <span className="px-2 py-0.5 font-mono text-xs font-bold text-stone-700">
        {label}
      </span>
      <div className="h-4 w-px bg-stone-200" aria-hidden="true" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRotateCCW}
        className="h-8 w-8 rounded-xl p-0 text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:scale-95"
        title="Rotate Counter-Clockwise 90° (Shift+R)"
        aria-label="Rotate 90 degrees counter-clockwise"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRotateCW}
        className="h-8 w-8 rounded-xl p-0 text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:scale-95"
        title="Rotate Clockwise 90° (R or Double-click)"
        aria-label="Rotate 90 degrees clockwise"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onFlip}
        className="h-8 w-8 rounded-xl p-0 text-stone-700 hover:bg-stone-100 hover:text-stone-900 active:scale-95"
        title="Flip Horizontally (F)"
        aria-label="Flip horizontally"
      >
        <FlipHorizontal className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-stone-200" aria-hidden="true" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onDeselect}
        className="h-7 w-7 rounded-xl p-0 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        title="Close controls (Escape)"
        aria-label="Close controls"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
