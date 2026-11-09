'use client';

import { useMemo } from 'react';
import { vec, toPathString, polygonCentroid, fmt, Vec2 } from '@/lib/geometry/primitives';
import { makeProjector } from '@/features/shared/projector';
import { PALETTE } from '@/lib/palette';

interface AreaDiagramProps {
  a: number;
  b: number;
}

/**
 * Module 1 canvas: right triangle with live squares on all three sides.
 * Pure render — every point is projected from world space (y up).
 */
export function AreaDiagram({ a, b }: AreaDiagramProps) {
  const W = 900;
  const H = 740;

  const view = useMemo(() => {
    const bounds = {
      minX: -b - 1.6,
      minY: -a - 1.6,
      maxX: a + b + 1.2,
      maxY: a + b + 1.2,
    };
    const proj = makeProjector(bounds, W, H, 0.05);
    const ptC = proj.toSvg(vec(0, 0)); // Right Angle
    const ptA = proj.toSvg(vec(a, 0)); // leg a
    const ptB = proj.toSvg(vec(0, b)); // leg b
    const triangle = [vec(0, 0), vec(a, 0), vec(0, b)].map(proj.toSvg);
    const squareA = [vec(0, 0), vec(a, 0), vec(a, -a), vec(0, -a)].map(proj.toSvg);
    const squareB = [vec(0, 0), vec(0, b), vec(-b, b), vec(-b, 0)].map(proj.toSvg);
    const squareC = [vec(a, 0), vec(a + b, a), vec(b, a + b), vec(0, b)].map(proj.toSvg);

    const cArea = a * a + b * b;
    const c = Math.sqrt(cArea);

    const labelIn = (poly: Vec2[], factor = 0.2) => {
      const xs = poly.map((p) => p.x);
      const ys = poly.map((p) => p.y);
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      return Math.max(13, Math.min(30, Math.min(w, h) * factor));
    };

    const cent = (polyWorld: Vec2[]) => proj.toSvg(polygonCentroid(polyWorld));

    return {
      proj,
      ptA,
      ptB,
      ptC,
      paths: {
        triangle: toPathString(triangle),
        squareA: toPathString(squareA),
        squareB: toPathString(squareB),
        squareC: toPathString(squareC),
      },
      labels: {
        a2: cent([vec(0, 0), vec(a, 0), vec(a, -a), vec(0, -a)]),
        b2: cent([vec(0, 0), vec(0, b), vec(-b, b), vec(-b, 0)]),
        c2: proj.toSvg(vec((a + b) / 2, (a + b) / 2)),
        sideA: proj.toSvg(vec(a / 2, -a - 0.8)),
        sideB: proj.toSvg(vec(-b - 0.8, b / 2)),
        sideC: proj.toSvg(vec(a / 2 + (b / c) * 0.5, b / 2 + (a / c) * 0.5)),
      },
      font: {
        sqA: labelIn(squareA),
        sqB: labelIn(squareB),
        sqC: labelIn(squareC),
      },
      rightAngle: proj.toSvg(vec(0, 0)),
      raX: proj.toSvg(vec(0, 0)),
      marker: [proj.toSvg(vec(0, Math.min(0.8, a / 3))), proj.toSvg(vec(Math.min(0.8, a / 3), 0))],
    };
  }, [a, b]);

  const cArea = a * a + b * b;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Right triangle with leg a = ${fmt(a)}, leg b = ${fmt(b)}. Square areas: a squared = ${fmt(a * a)}, b squared = ${fmt(b * b)}, c squared = ${fmt(cArea)}.`}
    >
      {/* squares */}
      <path d={view.paths.squareC} fill={PALETTE.c.fill} stroke={PALETTE.c.stroke} strokeWidth="3" opacity="0.95" />
      <path d={view.paths.squareA} fill={PALETTE.a.fill} stroke={PALETTE.a.stroke} strokeWidth="3" opacity="0.95" />
      <path d={view.paths.squareB} fill={PALETTE.b.fill} stroke={PALETTE.b.stroke} strokeWidth="3" opacity="0.95" />

      {/* triangle on top */}
      <path d={view.paths.triangle} fill={PALETTE.triangle.fill} stroke={PALETTE.triangle.stroke} strokeWidth="3.5" />

      <g className="font-mono text-sm font-bold fill-stone-900 select-none">
        {/* Point A */}
        <circle cx={view.ptA.x} cy={view.ptA.y} r="5" className="fill-amber-600 stroke-white stroke-2" />
        <text x={view.ptA.x + 14} y={view.ptA.y + 16} textAnchor="start" dominantBaseline="central">
          A
        </text>

        {/* Point B */}
        <circle cx={view.ptB.x} cy={view.ptB.y} r="5" className="fill-teal-600 stroke-white stroke-2" />
        <text x={view.ptB.x - 14} y={view.ptB.y - 12} textAnchor="end" dominantBaseline="central">
          B
        </text>

        {/* Point C */}
        <circle cx={view.ptC.x} cy={view.ptC.y} r="5" className="fill-rose-600 stroke-white stroke-2" />
        <text x={view.ptC.x - 14} y={view.ptC.y + 16} textAnchor="end" dominantBaseline="central">
          C
        </text>
      </g>

      {/* right-angle marker (small square tucked into the corner) */}
      <rect
        x={Math.min(view.marker[0].x, view.marker[1].x)}
        y={Math.min(view.marker[0].y, view.marker[1].y)}
        width={Math.abs(view.marker[1].x - view.marker[0].x)}
        height={Math.abs(view.marker[0].y - view.marker[1].y)}
        fill="none"
        stroke={PALETTE.triangle.stroke}
        strokeWidth="2"
      />

      {/* square area labels */}
      <text x={view.labels.a2.x} y={view.labels.a2.y} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={view.font.sqA} className="font-mono fill-amber-900">
        {fmt(a * a)}
      </text>
      <text x={view.labels.b2.x} y={view.labels.b2.y} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={view.font.sqB} className="font-mono fill-teal-50">
        {fmt(b * b)}
      </text>
      <text x={view.labels.c2.x} y={view.labels.c2.y} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={view.font.sqC} className="font-mono fill-rose-50">
        {fmt(cArea)}
      </text>

      {/* side labels */}
      <text x={view.labels.sideA.x} y={view.labels.sideA.y} textAnchor="middle" fontWeight={700} fontSize={Math.max(14, view.font.sqA * 0.7)} className="fill-stone-500">
        a = {fmt(a)}
      </text>
      <text x={view.labels.sideB.x} y={view.labels.sideB.y} textAnchor="middle" fontWeight={700} fontSize={Math.max(14, view.font.sqB * 0.7)} className="fill-stone-500">
        b = {fmt(b)}
      </text>
      <text x={view.labels.sideC.x} y={view.labels.sideC.y} textAnchor="middle" fontWeight={700} fontSize={Math.max(14, view.font.sqC * 0.7)} className="fill-rose-900">
        c = {fmt(Math.sqrt(cArea))}
      </text>
    </svg>
  );
}
