/**
 * Perigal's dissection engine — pure math, no DOM.
 *
 * Canonical world model (y up):
 *  - Right angle of the triangle sits at the origin (0, 0).
 *  - Leg `a` (shorter) runs along +x; leg `b` (longer) runs along +y.
 *  - Square a²  : built below leg a      → [0, a] × [−a, 0]
 *  - Square b²  : built left of leg b    → [−b, 0] × [0, b]
 *  - Square c²  : built on the hypotenuse, outward (up-right).
 *
 * Perigal's theorem (verified analytically for a=3,b=4 and a=5,b=12):
 *  - Cut b² with two perpendicular lines through its centre O, one of them
 *    parallel to the hypotenuse. The 4 congruent quadrilaterals have edge
 *    pattern (b−a)/2, c/2, c/2, (a+b)/2.
 *  - Placed at the corners of c² (each piece rotated +90° successively),
 *    they leave an axis-aligned square hole of side exactly `a`, centred in
 *    the assembly. Dropping a² into the hole proves a² + b² = c².
 */

import {
  Vec2,
  vec,
  add,
  sub,
  mul,
  normalize,
  rotateDeg,
  polygonArea,
  polygonCentroid,
  clipHalfPlane,
  pointInPolygon,
} from './primitives';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface WorldModel {
  /** shorter leg */
  a: number;
  /** longer leg (its square gets dissected) */
  b: number;
  /** hypotenuse */
  c: number;
  triangle: Vec2[];
  squareA: Vec2[];
  squareB: Vec2[];
  squareC: Vec2[];
  centerB: Vec2;
  centerC: Vec2;
  /** direction angle of the hypotenuse measured from +x, in (90°, 180°) */
  hypAngleDeg: number;
  bounds: Bounds;
}

export type PieceId = 'b1' | 'b2' | 'b3' | 'b4' | 'a';

export interface CutPiece {
  id: PieceId;
  /** polygon in world coordinates at its resting (cut) position */
  polygon: Vec2[];
  centroid: Vec2;
}

export function createWorld(leg1: number, leg2: number): WorldModel {
  const a = Math.min(leg1, leg2);
  const b = Math.max(leg1, leg2);
  if (!(a > 0) || !Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Leg lengths must be positive finite numbers.');
  }
  const c = Math.hypot(a, b);
  return {
    a,
    b,
    c,
    triangle: [vec(0, 0), vec(a, 0), vec(0, b)],
    squareA: [vec(0, 0), vec(a, 0), vec(a, -a), vec(0, -a)],
    squareB: [vec(0, 0), vec(0, b), vec(-b, b), vec(-b, 0)],
    squareC: [vec(a, 0), vec(a + b, a), vec(b, a + b), vec(0, b)],
    centerB: vec(-b / 2, b / 2),
    centerC: vec((a + b) / 2, (a + b) / 2),
    hypAngleDeg: (Math.atan2(b, -a) * 180) / Math.PI,
    bounds: { minX: -b, minY: -a, maxX: a + b, maxY: a + b },
  };
}

/**
 * The two slider angles that produce the correct cutting line PAIR.
 * A line pair {θ, θ+90} is correct when one of its lines is parallel to the
 * hypotenuse, so both θ* and θ*−90 (normalised into [0,180)) are valid.
 */
export function correctCutAnglesDeg(m: WorldModel): [number, number] {
  const norm = ((m.hypAngleDeg % 180) + 180) % 180;
  const alt = (((norm - 90) % 180) + 180) % 180;
  return [norm, alt];
}

/** True when the current cut angle makes the puzzle solvable. */
export function isCutCorrect(m: WorldModel, angleDeg: number, tolDeg = 2.5): boolean {
  const norm = ((angleDeg % 180) + 180) % 180;
  return correctCutAnglesDeg(m).some((t) => {
    const d = Math.abs(norm - t);
    return Math.min(d, 180 - d) <= tolDeg;
  });
}

/** The angle the slider should snap to for a correct cut (closest valid angle). */
export function snapCutAngle(m: WorldModel, angleDeg: number): number {
  const norm = ((angleDeg % 180) + 180) % 180;
  const [t1, t2] = correctCutAnglesDeg(m);
  const d1 = Math.abs(norm - t1);
  const d2 = Math.abs(norm - t2);
  return d1 <= d2 ? t1 : t2;
}

/** Extend a ray from `origin` towards `dir` until it leaves the given box. */
function rayToBoxExit(origin: Vec2, dir: Vec2, bounds: Bounds): Vec2 {
  let tMax = Infinity;
  if (dir.x > 1e-12) tMax = Math.min(tMax, (bounds.maxX - origin.x) / dir.x);
  if (dir.x < -1e-12) tMax = Math.min(tMax, (bounds.minX - origin.x) / dir.x);
  if (dir.y > 1e-12) tMax = Math.min(tMax, (bounds.maxY - origin.y) / dir.y);
  if (dir.y < -1e-12) tMax = Math.min(tMax, (bounds.minY - origin.y) / dir.y);
  if (!Number.isFinite(tMax)) tMax = 1;
  return add(origin, mul(dir, tMax));
}

/** Segment endpoints of a cut line drawn across (and slightly beyond) square b². */
export function cutLineSegment(m: WorldModel, angleDeg: number, overshoot = 0.6): [Vec2, Vec2] {
  const rad = (angleDeg * Math.PI) / 180;
  const dir = vec(Math.cos(rad), Math.sin(rad));
  const inner = rayToBoxExit(m.centerB, dir, m.bounds);
  const outer = rayToBoxExit(m.centerB, mul(dir, -1), m.bounds);
  const extendOut = normalize(sub(outer, m.centerB));
  const extendIn = normalize(sub(inner, m.centerB));
  return [add(outer, mul(extendOut, overshoot)), add(inner, mul(extendIn, overshoot))];
}

/**
 * Dissect square b² with two perpendicular lines through its centre.
 * Returns the 4 pieces, each tagged with the square corner it contains.
 */
export function cutSquareB(m: WorldModel, angleDeg: number): CutPiece[] {
  const O = m.centerB;
  const rad = (angleDeg * Math.PI) / 180;
  const d1 = vec(Math.cos(rad), Math.sin(rad));
  const d2 = vec(Math.cos(rad + Math.PI / 2), Math.sin(rad + Math.PI / 2));

  const left1 = clipHalfPlane(m.squareB, O, add(O, d1));
  const right1 = clipHalfPlane(m.squareB, add(O, d1), O);
  const quads = [
    clipHalfPlane(left1, O, add(O, d2)),
    clipHalfPlane(left1, add(O, d2), O),
    clipHalfPlane(right1, O, add(O, d2)),
    clipHalfPlane(right1, add(O, d2), O),
  ];

  const corners: Array<[PieceId, Vec2]> = [
    ['b1', vec(0, 0)],
    ['b2', vec(0, m.b)],
    ['b3', vec(-m.b, m.b)],
    ['b4', vec(-m.b, 0)],
  ];

  return corners.map(([id, corner]) => {
    const polygon =
      quads.find((q) => q.length >= 3 && pointInPolygon(corner, q, 1e-6)) ??
      quads.find((q) => q.length >= 3) ??
      [];
    return { id, polygon, centroid: polygonCentroid(polygon) };
  });
}

/** The a² square as a draggable piece (resting position below the triangle). */
export function makeAPiece(m: WorldModel): CutPiece {
  return { id: 'a', polygon: m.squareA, centroid: polygonCentroid(m.squareA) };
}

export interface AssemblyTarget {
  id: PieceId;
  polygon: Vec2[];
  centroid: Vec2;
}

export interface AssemblyPlan {
  targets: AssemblyTarget[];
  /** the empty a²-shaped hole in the middle of the assembled c² */
  hole: Vec2[];
}

/**
 * Compute the 5 slot polygons inside square c² (4 dissected pieces + central
 * a² hole) and their mapping from the cut pieces (by id).
 */
export function computeAssembly(m: WorldModel): AssemblyPlan {
  const { a, b, c } = m;
  const s = (b - a) / 2; // short edge
  const L = (a + b) / 2; // long edge
  const K1 = vec(a, 0);
  const K2 = vec(a + b, a);
  const K3 = vec(b, a + b);
  const K4 = vec(0, b);
  const M = m.centerC;
  const d1 = normalize(sub(K2, K1)); // (b, a)/c

  // Target piece at corner K1 — verified against the hand-computed 3-4-5 case.
  const A = add(K1, mul(d1, c / 2));
  const B = add(A, vec(0, s));
  const C = add(B, vec(-L, 0));
  const t1 = [K1, A, B, C];

  const rot90 = (poly: Vec2[]) => poly.map((p) => rotateDeg(p, M, 90));
  const t2 = rot90(t1);
  const t3 = rot90(t2);
  const t4 = rot90(t3);

  const hole = [
    vec(b / 2, b / 2),
    vec(b / 2 + a, b / 2),
    vec(b / 2 + a, b / 2 + a),
    vec(b / 2, b / 2 + a),
  ];

  const withMeta = (id: PieceId, polygon: Vec2[]): AssemblyTarget => ({
    id,
    polygon,
    centroid: polygonCentroid(polygon),
  });

  return {
    targets: [withMeta('b1', t1), withMeta('b2', t2), withMeta('b3', t3), withMeta('b4', t4), withMeta('a', hole)],
    hole,
  };
}
