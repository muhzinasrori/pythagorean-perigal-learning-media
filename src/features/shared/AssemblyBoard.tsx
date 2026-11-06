'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CutPiece,
  PieceId,
  WorldModel,
  computeAssembly,
} from '@/lib/geometry/perigal';
import {
  toPathString,
} from '@/lib/geometry/primitives';
import {
  bestSlotFor,
  PlacementReason,
} from '@/lib/geometry/placement';
import { makeProjector } from '@/features/shared/projector';
import { PALETTE, PIECE_SHADES } from '@/lib/palette';

interface PieceState {
  dx: number; // svg-unit translate X
  dy: number; // svg-unit translate Y
  rot: number; // svg-unit rotation (screen space)
  placed: boolean;
}

interface AssemblyBoardProps {
  world: WorldModel;
  /** 4 b-pieces (cut already applied) + the a² piece, at resting positions */
  pieces: CutPiece[];
  cutCorrect: boolean;
  onComplete: () => void;
  onPlacedChange?: (placed: number, total: number) => void;
  /** fired the first time any piece is grabbed (used to start the challenge timer) */
  onFirstGrab?: () => void;
  /** increment to trigger the auto-assemble animation */
  autoSignal: number;
}

/**
 * RESET STRATEGY: the parent remounts this board (React `key`) instead of an
 * in-place reset — guaranteed-fresh state with zero effects.
 */

const W = 1000;
const H = 760;

const ZERO: PieceState = { dx: 0, dy: 0, rot: 0, placed: false };

interface TweenAnim {
  from: PieceState;
  to: PieceState;
  t0: number;
  dur: number;
}

/**
 * Module-level rAF tween runner — lives OUTSIDE React so the animation loop
 * never fights the component lifecycle (and satisfies the React compiler).
 */
function createTweenRunner(
  apply: (updater: (prev: Record<PieceId, PieceState>) => Record<PieceId, PieceState>) => void,
) {
  const anims = new Map<PieceId, TweenAnim>();
  let raf: number | null = null;

  const tick = (now: number) => {
    if (anims.size === 0) {
      raf = null;
      return;
    }
    apply((prev) => {
      const next = { ...prev };
      anims.forEach((anim, id) => {
        let t = (now - anim.t0) / anim.dur;
        if (t >= 1) {
          t = 1;
          anims.delete(id);
        }
        const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        next[id] = {
          dx: anim.from.dx + (anim.to.dx - anim.from.dx) * e,
          dy: anim.from.dy + (anim.to.dy - anim.from.dy) * e,
          rot: anim.from.rot + (anim.to.rot - anim.from.rot) * e,
          placed: anim.to.placed,
        };
      });
      return next;
    });
    if (anims.size > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  };

  return {
    start(id: PieceId, from: PieceState, to: PieceState, dur: number) {
      anims.set(id, { from, to, t0: performance.now(), dur });
      if (raf === null) raf = requestAnimationFrame(tick);
    },
    cancel(id: PieceId) {
      anims.delete(id);
    },
    stop() {
      anims.clear();
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
  };
}

const shadeFor = (id: PieceId, index: number) =>
  id === 'a' ? PALETTE.a.fill : PIECE_SHADES[index % PIECE_SHADES.length];

/**
 * Interactive drag-and-drop board: assemble the dissected pieces (+ a²)
 * into the c² frame. Dragging is translation-only; on a valid drop near the
 * matching slot the piece tweens (translate + rotate) exactly into place.
 *
 * Geometry guarantee (verified by scripts/verify-geometry.ts): at a correct
 * cut angle every piece is congruent to its slot, so the tween lands the
 * polygon EXACTLY on the slot — no visible seams.
 */
const REASON_MESSAGES: Record<PlacementReason, string> = {
  ok: '',
  'too-far': 'Closer to its slot…',
  'wrong-rotation': 'Rotate the piece first…',
  'needs-flip': 'This piece is mirrored — flip it…',
  'wrong-slot': 'Try another slot…',
};

export function AssemblyBoard({
  world,
  pieces,
  cutCorrect,
  onComplete,
  onPlacedChange,
  onFirstGrab,
  autoSignal,
}: AssemblyBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const proj = useMemo(() => makeProjector(world.bounds, W, H, 0.05), [world]);
  const plan = useMemo(() => computeAssembly(world), [world]);

  const [placements, setPlacements] = useState<Record<PieceId, PieceState>>(
    () => Object.fromEntries(pieces.map((p) => [p.id, ZERO])) as Record<PieceId, PieceState>,
  );
  const placementsRef = useRef(placements);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  const [occupiedSlots, setOccupiedSlots] = useState<Record<PieceId, PieceId | null>>({
    b1: null,
    b2: null,
    b3: null,
    b4: null,
    a: null,
  });
  const [hint, setHint] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<PieceId | null>(null);
  const dragRef = useRef<{
    id: PieceId;
    startClientX: number;
    startClientY: number;
    startDx: number;
    startDy: number;
    unitsPerPx: number;
  } | null>(null);
  const grabbedOnceRef = useRef(false);
  const completedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const runnerRef = useRef<ReturnType<typeof createTweenRunner> | null>(null);
  if (runnerRef.current === null) {
    runnerRef.current = createTweenRunner((updater) => setPlacements(updater));
  }
  const runner = runnerRef.current;

  // Pre-projected static geometry
  const statics = useMemo(() => {
    const c2 = world.squareC.map(proj.toSvg);
    const hole = plan.hole.map(proj.toSvg);
    const slots = plan.targets.map((t) => ({ id: t.id, pts: t.polygon.map(proj.toSvg) }));
    const rest = pieces.map((p) => ({
      piece: p,
      pts: p.polygon.map(proj.toSvg),
      centroidSvg: proj.toSvg(p.centroid),
    }));
    return { c2, hole, slots, rest };
  }, [world, plan, pieces, proj]);

  const tweenTo = useCallback(
    (id: PieceId, to: PieceState, dur: number) => {
      runner.start(id, placementsRef.current[id], to, dur);
    },
    [runner],
  );

  const snapPiece = useCallback(
    (id: PieceId, ignoreDistance: boolean) => {
      const piece = pieces.find((p) => p.id === id);
      if (!piece) return;
      // Pedagogical guard: with a wrong cut angle the shapes can never match,
      // so snapping (even forced) is disabled on purpose.
      if (!cutCorrect) return;
      const cur = placementsRef.current[id];
      if (cur.placed) return;

      const occupiedSlotIds = Object.entries(occupiedSlots)
        .filter(([slotId, pieceId]) => pieceId !== null && pieceId !== id)
        .map(([slotId]) => slotId as PieceId);

      const best = bestSlotFor(piece, plan.targets, {
        dx: cur.dx,
        dy: cur.dy,
        rot: cur.rot,
        scale: proj.scale,
        snapRadius: Math.max(0.7, world.a * 0.32),
        ignoreDistance,
        occupiedSlotIds,
      });

      if (!best || !best.verdict.accepted) {
        // Rejection: do not snap; give visible + spoken feedback and shake/bounce
        const reason = best?.verdict.reason ?? 'too-far';
        setHint(REASON_MESSAGES[reason] ?? 'Keep trying…');
        const bounceTimer = window.setTimeout(() => setHint(null), 2500);
        timeoutsRef.current.push(bounceTimer);

        const shakeDur = 70;
        const shakeAmt = 8;
        runner.start(id, cur, { ...cur, dx: cur.dx + shakeAmt }, shakeDur);
        const t1 = window.setTimeout(() => {
          runner.start(id, { ...cur, dx: cur.dx + shakeAmt }, { ...cur, dx: cur.dx - shakeAmt }, shakeDur);
          const t2 = window.setTimeout(() => {
            runner.start(id, { ...cur, dx: cur.dx - shakeAmt }, cur, shakeDur);
          }, shakeDur);
          timeoutsRef.current.push(t2);
        }, shakeDur);
        timeoutsRef.current.push(t1);
        return;
      }

      setHint(null);
      const targetSlotId = best.target.id;
      setOccupiedSlots((prev) => ({ ...prev, [targetSlotId]: id }));

      const nextState: PieceState = {
        dx: cur.dx + best.verdict.corrective.dx,
        dy: cur.dy + best.verdict.corrective.dy,
        rot: cur.rot + best.verdict.corrective.rotDelta,
        placed: true,
      };

      tweenTo(id, nextState, 380);

      setPlacements((prev) => {
        const next = { ...prev, [id]: nextState };
        const count = Object.values(next).filter((p) => p.placed).length;
        onPlacedChange?.(count, pieces.length);
        return next;
      });
    },
    [pieces, plan.targets, proj, tweenTo, world.a, onPlacedChange, cutCorrect, occupiedSlots],
  );

  // Auto-assemble
  useEffect(() => {
    if (autoSignal === 0) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    runner.stop();
    pieces.forEach((p, i) => {
      const t = window.setTimeout(() => snapPiece(p.id, true), i * 220);
      timeoutsRef.current.push(t);
    });
  }, [autoSignal]);

  // Completion detection
  const placedCount = pieces.filter((p) => placements[p.id]?.placed).length;
  useEffect(() => {
    if (placedCount === pieces.length && pieces.length > 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [placedCount, pieces.length, onComplete]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout);
      runnerRef.current?.stop();
    },
    [],
  );

  const onPointerDown = (id: PieceId) => (e: React.PointerEvent<SVGGElement>) => {
    const cur = placementsRef.current[id];
    if (cur.placed || !svgRef.current) return;
    e.preventDefault();
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm || ctm.a === 0) return;
    // Pointer capture keeps the drag alive when the finger/cursor leaves the
    // piece. Some browsers/contexts can refuse it — the drag still works via
    // element-local events, so never let this throw.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unavailable — non-fatal */
    }
    dragRef.current = {
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startDx: cur.dx,
      startDy: cur.dy,
      unitsPerPx: 1 / ctm.a,
    };
    setActiveId(id);
    runner.cancel(id);
    if (!grabbedOnceRef.current) {
      grabbedOnceRef.current = true;
      onFirstGrab?.();
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startClientX) * drag.unitsPerPx;
    const dy = (e.clientY - drag.startClientY) * drag.unitsPerPx;
    setPlacements((prev) => ({
      ...prev,
      [drag.id]: { ...prev[drag.id], dx: drag.startDx + dx, dy: drag.startDy + dy },
    }));
  };

  const onPointerUp = (id: PieceId) => () => {
    if (dragRef.current?.id !== id) return;
    dragRef.current = null;
    setActiveId(null);
    snapPiece(id, false);
  };

  // Render order: placed pieces below, active piece on top
  const ordered = [...statics.rest].sort((r1, r2) => {
    const p1 = placements[r1.piece.id]?.placed ? 0 : 1;
    const p2 = placements[r2.piece.id]?.placed ? 0 : 1;
    if (p1 !== p2) return p1 - p2;
    if (r1.piece.id === activeId) return 1;
    if (r2.piece.id === activeId) return -1;
    return 0;
  });

  const holePlaced = placements['a']?.placed ?? false;

  return (
    <div className="relative w-full">
      {/* Screen-reader drop feedback */}
      <div aria-live="polite" className="sr-only">
        {hint}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="board-surface h-auto w-full select-none"
        role="application"
        aria-label="Assembly board: drag the pieces into the square on the hypotenuse. Use the Auto-assemble button for keyboard-free play."
      >
        {/* c² frame */}
        <path d={toPathString(statics.c2)} fill={PALETTE.c.fillSoft} opacity="0.45" />
        <path
          d={toPathString(statics.c2)}
          fill="none"
          stroke={PALETTE.c.stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* central a² hole guide */}
        <path
          d={toPathString(statics.hole)}
          fill={holePlaced ? 'none' : '#ffffff'}
          fillOpacity={holePlaced ? 0 : 0.65}
          stroke={PALETTE.c.stroke}
          strokeWidth={activeId === 'a' && !holePlaced ? '4' : '2.5'}
          strokeDasharray={holePlaced ? undefined : activeId === 'a' ? undefined : '7 7'}
          className={holePlaced ? undefined : activeId === 'a' ? 'animate-pulse' : 'dash-flow'}
          opacity={activeId === 'a' || activeId === null ? 1 : 0.35}
        />
        {!holePlaced && (
          <text
            x={proj.toSvg(plan.targets.find((t) => t.id === 'a')!.centroid).x}
            y={proj.toSvg(plan.targets.find((t) => t.id === 'a')!.centroid).y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(13, world.a * proj.scale * 0.22)}
            fontWeight={700}
            className="fill-rose-700 font-mono"
          >
            a²
          </text>
        )}

        {/* slot guides */}
        {cutCorrect &&
          statics.slots
            .filter((s) => s.id !== 'a')
            .map((s) => {
              const isOccupied = occupiedSlots[s.id] !== null;
              const isCompatible = activeId !== null && activeId !== 'a' && !isOccupied;
              return (
                <path
                  key={`slot-${s.id}`}
                  d={toPathString(s.pts)}
                  fill="none"
                  stroke={PALETTE.b.stroke}
                  strokeWidth={isCompatible ? '3.5' : '1.6'}
                  strokeDasharray={isCompatible ? undefined : '5 6'}
                  opacity={isCompatible ? '0.95' : activeId !== null ? '0.25' : '0.55'}
                  pointerEvents="none"
                />
              );
            })}

        {/* resting outlines (where pieces came from) */}
        <path
          d={toPathString(world.squareB.map(proj.toSvg))}
          fill="none"
          stroke={PALETTE.guide}
          strokeWidth="1.6"
          strokeDasharray="4 6"
          opacity="0.7"
          pointerEvents="none"
        />
        <path
          d={toPathString(world.squareA.map(proj.toSvg))}
          fill="none"
          stroke={PALETTE.guide}
          strokeWidth="1.6"
          strokeDasharray="4 6"
          opacity="0.7"
          pointerEvents="none"
        />
        <path
          d={toPathString(world.triangle.map(proj.toSvg))}
          fill={PALETTE.triangle.fill}
          opacity="0.5"
          stroke={PALETTE.triangle.stroke}
          strokeWidth="1.5"
          pointerEvents="none"
        />

        {/* pieces */}
        {ordered.map(({ piece, pts, centroidSvg }, index) => {
          const st = placements[piece.id] ?? ZERO;
          const label = piece.id === 'a' ? 'a' : piece.id.slice(1);
          const labelFill = piece.id === 'a' ? PALETTE.a.text : '#134e4a';
          return (
            <g
              key={piece.id}
              transform={`translate(${st.dx} ${st.dy}) rotate(${st.rot} ${centroidSvg.x} ${centroidSvg.y})`}
              onPointerDown={onPointerDown(piece.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp(piece.id)}
              onPointerCancel={onPointerUp(piece.id)}
              style={{
                cursor: st.placed ? 'default' : activeId === piece.id ? 'grabbing' : 'grab',
              }}
              aria-label={`Puzzle piece ${label}`}
            >
              <path
                d={toPathString(pts)}
                fill={shadeFor(piece.id, index)}
                stroke={st.placed ? '#0f766e' : '#115e59'}
                strokeWidth="2.5"
                strokeLinejoin="round"
                opacity={st.placed ? 0.96 : 1}
              />
              <circle
                cx={centroidSvg.x}
                cy={centroidSvg.y}
                r={Math.max(10, Math.min(16, world.a * proj.scale * 0.14))}
                fill="#ffffff"
                opacity="0.92"
                pointerEvents="none"
              />
              <text
                x={centroidSvg.x}
                y={centroidSvg.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(11, Math.min(15, world.a * proj.scale * 0.15))}
                fontWeight={800}
                className="font-mono"
                fill={labelFill}
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating feedback hint */}
      {hint && (
        <div
          role="status"
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-all"
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export type { AssemblyBoardProps };
