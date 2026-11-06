'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CutPiece, WorldModel, cutLineSegment, cutSquareB } from '@/lib/geometry/perigal';
import { add, mul, normalize, sub, toPathString, vec, Vec2 } from '@/lib/geometry/primitives';
import { makeProjector } from '@/features/shared/projector';
import { PALETTE, PIECE_SHADES } from '@/lib/palette';

interface StudioCanvasProps {
  world: WorldModel;
  stage: 1 | 2 | 3;
  diag1: boolean;
  diag2: boolean;
  cutAngle: number;
  cutExecuted: boolean;
}

const W = 1000;
const H = 760;

/**
 * Module 2 canvas for stages 1–3: the guided construction sequence on
 * square b². Stage 4 swaps this component for the AssemblyBoard.
 */
export function StudioCanvas({ world, stage, diag1, diag2, cutAngle, cutExecuted }: StudioCanvasProps) {
  const view = useMemo(() => {
    const proj = makeProjector(world.bounds, W, H, 0.05);
    const P = (poly: ReturnType<typeof vec>[]) => poly.map(proj.toSvg);

    const squareB = P(world.squareB);
    const squareA = P(world.squareA);
    const triangle = P(world.triangle);
    const squareC = P(world.squareC);
    const O = proj.toSvg(world.centerB);

    const diagonal1 = [proj.toSvg(vec(0, 0)), proj.toSvg(vec(-world.b, world.b))];
    const diagonal2 = [proj.toSvg(vec(0, world.b)), proj.toSvg(vec(-world.b, 0))];

    const [l1a, l1b] = cutLineSegment(world, cutAngle, 0.5).map(proj.toSvg);
    const [l2a, l2b] = cutLineSegment(world, cutAngle + 90, 0.5).map(proj.toSvg);
    const [ra, rb] = cutLineSegment(world, world.hypAngleDeg, 0.35).map(proj.toSvg);

    const pieces: Array<{ piece: CutPiece; pts: string; cx: number; cy: number; off: Vec2 }> = [];
    if (cutExecuted) {
      cutSquareB(world, cutAngle).forEach((piece) => {
        const pts = P(piece.polygon);
        const c = proj.toSvg(piece.centroid);
        // explode direction: away from O, in svg units (y flipped)
        const dir = normalize(sub(piece.centroid, world.centerB));
        pieces.push({
          piece,
          pts: toPathString(pts),
          cx: c.x,
          cy: c.y,
          off: { x: dir.x * 0.3 * proj.scale, y: -dir.y * 0.3 * proj.scale },
        });
      });
    }

    return {
      proj,
      squareB,
      squareA,
      triangle,
      squareC,
      O,
      diagonal1,
      diagonal2,
      line1: [l1a, l1b] as const,
      line2: [l2a, l2b] as const,
      refLine: [ra, rb] as const,
      pieces,
      fontSize: Math.max(16, Math.min(30, world.b * proj.scale * 0.12)),
      oRadius: Math.max(6, world.b * proj.scale * 0.03),
    };
  }, [world, diag1, diag2, cutAngle, cutExecuted]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Perigal construction workspace. Stage ${stage} of 4.`}
    >
      {/* a² square (context) */}
      <path d={toPathString(view.squareA)} fill={PALETTE.a.fill} stroke={PALETTE.a.stroke} strokeWidth="2.5" opacity="0.9" />
      <text
        x={view.proj.toSvg(vec(world.a / 2, -world.a / 2)).x}
        y={view.proj.toSvg(vec(world.a / 2, -world.a / 2)).y}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight={800}
        fontSize={view.fontSize}
        className="font-mono fill-amber-900"
      >
        a²
      </text>

      {/* triangle */}
      <path d={toPathString(view.triangle)} fill={PALETTE.triangle.fill} stroke={PALETTE.triangle.stroke} strokeWidth="3" />

      {/* c² destination frame — dashed, appears from stage 2 */}
      {stage >= 2 && (
        <path
          d={toPathString(view.squareC)}
          fill="none"
          stroke={PALETTE.c.stroke}
          strokeWidth="3"
          strokeDasharray="9 8"
          opacity="0.75"
        />
      )}
      {stage >= 2 && (
        <text
          x={view.proj.toSvg(vec((world.a + world.b) / 2, (world.a + world.b) / 2)).x}
          y={view.proj.toSvg(vec((world.a + world.b) / 2, (world.a + world.b) / 2)).y}
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight={800}
          fontSize={view.fontSize}
          className="font-mono fill-rose-500"
        >
          c²
        </text>
      )}

      {/* b² square — the star of the show (drawn after c² so it sits on top) */}
      <path d={toPathString(view.squareB)} fill={PALETTE.b.fillSoft} stroke={PALETTE.b.stroke} strokeWidth="3" />
      <text
        x={view.proj.toSvg(vec(-world.b / 2, world.b / 2)).x}
        y={view.proj.toSvg(vec(-world.b / 2, world.b / 2)).y - view.fontSize * 1.6}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight={800}
        fontSize={view.fontSize}
        className="font-mono fill-teal-900"
      >
        b²
      </text>

      {/* Stage 1: diagonals + centre O */}
      {diag1 && (
        <motion.line
          x1={view.diagonal1[0].x}
          y1={view.diagonal1[0].y}
          x2={view.diagonal1[1].x}
          y2={view.diagonal1[1].y}
          stroke={PALETTE.b.stroke}
          strokeWidth="2.5"
          strokeDasharray="3 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
      {diag2 && (
        <motion.line
          x1={view.diagonal2[0].x}
          y1={view.diagonal2[0].y}
          x2={view.diagonal2[1].x}
          y2={view.diagonal2[1].y}
          stroke={PALETTE.b.stroke}
          strokeWidth="2.5"
          strokeDasharray="3 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
      {diag1 && diag2 && (
        <g>
          <motion.circle
            cx={view.O.x}
            cy={view.O.y}
            r={view.oRadius * 2.2}
            fill={PALETTE.a.fill}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.65, 0.25, 0.65] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: `${view.O.x}px ${view.O.y}px` }}
          />
          <circle cx={view.O.x} cy={view.O.y} r={view.oRadius} fill={PALETTE.a.stroke} stroke="#fff" strokeWidth="2" />
          <text
            x={view.O.x + view.oRadius * 1.8}
            y={view.O.y - view.oRadius * 1.6}
            fontWeight={800}
            fontSize={view.fontSize}
            className="font-mono fill-amber-800"
          >
            O
          </text>
        </g>
      )}

      {/* Stage 2: reference direction (parallel to hypotenuse) + cutting lines */}
      {stage >= 2 && !cutExecuted && (
        <g>
          <line
            x1={view.refLine[0].x}
            y1={view.refLine[0].y}
            x2={view.refLine[1].x}
            y2={view.refLine[1].y}
            stroke={PALETTE.c.stroke}
            strokeWidth="2.5"
            strokeDasharray="8 7"
            className="dash-flow"
            opacity="0.8"
          />
          <text
            x={(view.refLine[0].x + view.refLine[1].x) / 2}
            y={(view.refLine[0].y + view.refLine[1].y) / 2 - 10}
            textAnchor="middle"
            fontWeight={700}
            fontSize={Math.max(13, view.fontSize * 0.7)}
            className="fill-rose-600 font-mono"
          >
            ∥ hypotenuse c
          </text>

          <line x1={view.line1[0].x} y1={view.line1[0].y} x2={view.line1[1].x} y2={view.line1[1].y} stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={view.line2[0].x} y1={view.line2[0].y} x2={view.line2[1].x} y2={view.line2[1].y} stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {/* Stage 3: cut pieces */}
      {cutExecuted &&
        view.pieces.map((p, i) => (
          <motion.g
            key={p.piece.id}
            initial={{ x: 0, y: 0 }}
            animate={{ x: p.off.x, y: p.off.y }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: i * 0.06 }}
          >
            <path d={p.pts} fill={PIECE_SHADES[i % PIECE_SHADES.length]} stroke="#115e59" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx={p.cx} cy={p.cy} r={Math.max(10, world.b * view.proj.scale * 0.035)} fill="#fff" opacity="0.92" />
            <text
              x={p.cx}
              y={p.cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontWeight={800}
              fontSize={Math.max(11, world.b * view.proj.scale * 0.038)}
              className="font-mono fill-teal-900"
            >
              {p.piece.id.slice(1)}
            </text>
          </motion.g>
        ))}

      {/* outline of b² stays visible after the cut */}
      {cutExecuted && (
        <path d={toPathString(view.squareB)} fill="none" stroke={PALETTE.b.stroke} strokeWidth="2" opacity="0.5" />
      )}
    </svg>
  );
}
