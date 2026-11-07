/**
 * Pure placement and snapping geometry engine.
 *
 * All functions operate in canonical world coordinates (y-up) without DOM
 * or React dependencies, and are fully unit-testable.
 */

import {
  CutPiece,
  PieceId,
  AssemblyTarget,
} from './perigal';
import {
  Vec2,
  vec,
  dist,
  rotateDeg,
  polygonArea,
  polygonCentroid,
  clipHalfPlane,
} from './primitives';

export type PlacementReason =
  | 'ok'
  | 'too-far'
  | 'wrong-rotation'
  | 'needs-flip'
  | 'wrong-slot';

export interface CorrectiveTransform {
  /** Translation delta X (in SVG units if scale passed, else world units) */
  dx: number;
  /** Translation delta Y (in SVG units if scale passed, else world units) */
  dy: number;
  /** Corrective rotation delta in SVG screen degrees (clockwise) */
  rotDelta: number;
  /** Whether horizontal flip is needed (reserved for Phase 2) */
  flipDelta: boolean;
}

export interface PlacementVerdict {
  accepted: boolean;
  reason: PlacementReason;
  overlapRatio: number;
  centroidDist: number;
  corrective: CorrectiveTransform;
}

export interface PlacementTransform {
  dx?: number;
  dy?: number;
  rot?: number;
  flip?: boolean;
}

export interface EvaluateOptions extends PlacementTransform {
  /** SVG scale (px per world unit). If omitted, 1 is assumed */
  scale?: number;
  /** Snap distance tolerance in world units. Default: Math.max(0.7, a * 0.32) */
  snapRadius?: number;
  /** When true, bypasses the centroid distance check (used by auto-assemble) */
  ignoreDistance?: boolean;
}

/** Normalize degree angle into (-180, 180]. */
export function normalizeAngleDeg(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

/** Ensure polygon vertices are in counter-clockwise order. */
function ensureCCW(poly: Vec2[]): Vec2[] {
  let s = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    s += p.x * q.y - q.x * p.y;
  }
  return s < 0 ? [...poly].reverse() : poly;
}

/** Convex polygon clipping to find the intersection of two convex polygons. */
export function convexPolygonIntersection(polyA: Vec2[], polyB: Vec2[]): Vec2[] {
  if (polyA.length < 3 || polyB.length < 3) return [];
  const bCCW = ensureCCW(polyB);
  let res = ensureCCW(polyA);
  const m = bCCW.length;
  for (let i = 0; i < m; i++) {
    const p1 = bCCW[i];
    const p2 = bCCW[(i + 1) % m];
    res = clipHalfPlane(res, p1, p2);
    if (res.length < 3) return [];
  }
  return res;
}

export interface RigidAlignmentResult {
  rotDeg: number;
  maxVertexError: number;
  relativeError: number;
  mirrored: boolean;
  cyclicShift: number;
}

/**
 * Compare source polygon against target polygon trying all cyclic vertex
 * correspondences and both orientations (direct vs mirrored/reversed).
 *
 * Both polygons are centered at origin before comparison.
 * Returns the best direct and mirrored alignments with rotation and max vertex error.
 */
export function rigidAlignment(
  sourcePoly: Vec2[],
  targetPoly: Vec2[],
): {
  unmirrored: RigidAlignmentResult;
  mirrored: RigidAlignmentResult;
  best: RigidAlignmentResult;
} {
  const n = sourcePoly.length;
  const cs = polygonCentroid(sourcePoly);
  const ct = polygonCentroid(targetPoly);

  const s0 = sourcePoly.map((p) => ({ x: p.x - cs.x, y: p.y - cs.y }));
  const t0 = targetPoly.map((p) => ({ x: p.x - ct.x, y: p.y - ct.y }));

  const maxR = Math.max(1e-12, ...t0.map((p) => Math.hypot(p.x, p.y)));

  // Direct (unmirrored) cyclic correspondences: i -> (i + k) % n
  let bestDirectShift = 0;
  let bestDirectRot = 0;
  let minDirectErr = Infinity;

  for (let k = 0; k < n; k++) {
    let H = 0;
    let K = 0;
    for (let i = 0; i < n; i++) {
      const p = s0[i];
      const q = t0[(i + k) % n];
      H += p.x * q.x + p.y * q.y;
      K += p.x * q.y - p.y * q.x;
    }
    const rot = normalizeAngleDeg((Math.atan2(K, H) * 180) / Math.PI);

    let maxErr = 0;
    for (let i = 0; i < n; i++) {
      const pRot = rotateDeg(s0[i], vec(0, 0), rot);
      const q = t0[(i + k) % n];
      const d = dist(pRot, q);
      if (d > maxErr) maxErr = d;
    }

    const isDirectBetter =
      maxErr < minDirectErr - 1e-5 ||
      (Math.abs(maxErr - minDirectErr) <= 1e-5 && Math.abs(rot) < Math.abs(bestDirectRot));

    if (isDirectBetter) {
      minDirectErr = maxErr;
      bestDirectShift = k;
      bestDirectRot = rot;
    }
  }

  // Reversed (mirrored) correspondences: reflect s0 across y-axis (flips winding), then cyclic shift
  const sMir = s0.map((p) => vec(-p.x, p.y));
  let bestMirroredShift = 0;
  let bestMirroredRot = 0;
  let minMirroredErr = Infinity;

  for (let k = 0; k < n; k++) {
    let H = 0;
    let K = 0;
    for (let i = 0; i < n; i++) {
      const p = sMir[i];
      const q = t0[(i + k) % n];
      H += p.x * q.x + p.y * q.y;
      K += p.x * q.y - p.y * q.x;
    }
    const rot = normalizeAngleDeg((Math.atan2(K, H) * 180) / Math.PI);

    let maxErr = 0;
    for (let i = 0; i < n; i++) {
      const pRot = rotateDeg(sMir[i], vec(0, 0), rot);
      const q = t0[(i + k) % n];
      const d = dist(pRot, q);
      if (d > maxErr) maxErr = d;
    }

    const isMirroredBetter =
      maxErr < minMirroredErr - 1e-5 ||
      (Math.abs(maxErr - minMirroredErr) <= 1e-5 && Math.abs(rot) < Math.abs(bestMirroredRot));

    if (isMirroredBetter) {
      minMirroredErr = maxErr;
      bestMirroredShift = k;
      bestMirroredRot = rot;
    }
  }

  const unmirrored: RigidAlignmentResult = {
    rotDeg: bestDirectRot,
    maxVertexError: minDirectErr,
    relativeError: minDirectErr / maxR,
    mirrored: false,
    cyclicShift: bestDirectShift,
  };

  const mirrored: RigidAlignmentResult = {
    rotDeg: bestMirroredRot,
    maxVertexError: minMirroredErr,
    relativeError: minMirroredErr / maxR,
    mirrored: true,
    cyclicShift: bestMirroredShift,
  };

  const best = unmirrored.relativeError <= mirrored.relativeError ? unmirrored : mirrored;
  return { unmirrored, mirrored, best };
}

/**
 * Transform a resting piece polygon to world coordinates according to
 * student's current SVG translation, rotation, and flip.
 */
export function transformPieceToWorld(
  piece: CutPiece,
  opts?: EvaluateOptions,
): { polygon: Vec2[]; centroid: Vec2 } {
  const scale = opts?.scale && opts.scale > 0 ? opts.scale : 1;
  const isSvg = opts?.scale !== undefined;

  const worldDx = isSvg ? (opts?.dx ?? 0) / scale : (opts?.dx ?? 0);
  const worldDy = isSvg ? -(opts?.dy ?? 0) / scale : (opts?.dy ?? 0);
  // SVG rotation is clockwise; world rotation is CCW
  const worldRot = isSvg ? -(opts?.rot ?? 0) : (opts?.rot ?? 0);
  const flip = opts?.flip ?? false;

  const c0 = piece.centroid;
  let poly = piece.polygon;

  if (flip) {
    poly = poly.map((p) => vec(c0.x - (p.x - c0.x), p.y));
  }

  if (Math.abs(worldRot) > 1e-6) {
    poly = poly.map((p) => rotateDeg(p, c0, worldRot));
  }

  const curCentroid = vec(c0.x + worldDx, c0.y + worldDy);
  const worldPoly = poly.map((p) => vec(p.x + worldDx, p.y + worldDy));

  return { polygon: worldPoly, centroid: curCentroid };
}

/**
 * Evaluate whether the piece dropped at its current position / orientation
 * can snap into `target`.
 */
export function evaluatePlacement(
  piece: CutPiece,
  target: AssemblyTarget,
  opts?: EvaluateOptions,
): PlacementVerdict {
  // Central hole 'a' is reserved exclusively for piece 'a'; b-pieces cannot snap to 'a'
  if ((piece.id === 'a' && target.id !== 'a') || (piece.id !== 'a' && target.id === 'a')) {
    return {
      accepted: false,
      reason: 'wrong-slot',
      overlapRatio: 0,
      centroidDist: Infinity,
      corrective: { dx: 0, dy: 0, rotDelta: 0, flipDelta: false },
    };
  }

  const transformed = transformPieceToWorld(piece, opts);
  const pieceWorldPoly = transformed.polygon;
  const currentCentroid = transformed.centroid;

  const centroidDist = dist(currentCentroid, target.centroid);
  const snapRadius = opts?.snapRadius ?? Math.max(0.7, 3 * 0.32);

  // Polygon overlap ratio
  const origArea = Math.max(1e-12, polygonArea(piece.polygon));
  const inter = convexPolygonIntersection(pieceWorldPoly, target.polygon);
  const interArea = polygonArea(inter);
  const overlapRatio = interArea / origArea;

  // Orientation check on the current world orientation
  const alignment = rigidAlignment(pieceWorldPoly, target.polygon);
  const relErrorTol = 1e-5;
  const rotTolDeg = 2.5;

  let reason: PlacementReason = 'ok';
  let accepted = false;

  const isUnmirroredMatch = alignment.unmirrored.relativeError <= relErrorTol;
  const isMirroredMatch = alignment.mirrored.relativeError <= relErrorTol;

  if (isUnmirroredMatch) {
    if (Math.abs(alignment.unmirrored.rotDeg) <= rotTolDeg) {
      reason = 'ok';
    } else {
      reason = 'wrong-rotation';
    }
  } else if (isMirroredMatch) {
    reason = 'needs-flip';
  } else {
    reason = 'wrong-rotation';
  }

  const withinDistance = opts?.ignoreDistance || centroidDist <= snapRadius;
  const withinOverlap = opts?.ignoreDistance || overlapRatio >= 0.5;

  if (!withinDistance) {
    accepted = false;
    reason = 'too-far';
  } else if (!withinOverlap) {
    accepted = false;
    if (reason === 'ok') {
      reason = 'too-far';
    }
  } else if (reason === 'ok') {
    accepted = true;
  }

  // Calculate corrective delta
  const scale = opts?.scale && opts.scale > 0 ? opts.scale : 1;
  const isSvg = opts?.scale !== undefined;

  const worldDeltaX = target.centroid.x - currentCentroid.x;
  const worldDeltaY = target.centroid.y - currentCentroid.y;
  const rotDeltaWorld = alignment.unmirrored.rotDeg;

  const corrective: CorrectiveTransform = {
    dx: isSvg ? worldDeltaX * scale : worldDeltaX,
    dy: isSvg ? -worldDeltaY * scale : worldDeltaY,
    rotDelta: isSvg ? normalizeAngleDeg(-rotDeltaWorld) : normalizeAngleDeg(rotDeltaWorld),
    flipDelta: isMirroredMatch && !isUnmirroredMatch,
  };

  return {
    accepted,
    reason,
    overlapRatio,
    centroidDist,
    corrective,
  };
}

/**
 * Score all available candidate slots and pick the best slot for the piece.
 * Congruent b-pieces (b1..b4) can snap into ANY vacant b-slot if orientation matches.
 */
export function bestSlotFor(
  piece: CutPiece,
  targets: AssemblyTarget[],
  opts?: EvaluateOptions & { occupiedSlotIds?: Set<PieceId> | PieceId[] },
): { target: AssemblyTarget; verdict: PlacementVerdict } | null {
  const occupied = new Set(
    Array.isArray(opts?.occupiedSlotIds)
      ? opts.occupiedSlotIds
      : opts?.occupiedSlotIds
        ? Array.from(opts.occupiedSlotIds)
        : [],
  );

  const candidates = targets.filter((t) => {
    if (piece.id === 'a') return t.id === 'a';
    return t.id !== 'a' && !occupied.has(t.id);
  });

  if (candidates.length === 0) return null;

  let bestTarget = candidates[0];
  let bestVerdict = evaluatePlacement(piece, bestTarget, opts);

  for (let i = 1; i < candidates.length; i++) {
    const cand = candidates[i];
    const v = evaluatePlacement(piece, cand, opts);

    const isBetter =
      // 1. Accepted candidate beats rejected
      (v.accepted && !bestVerdict.accepted) ||
      (v.accepted === bestVerdict.accepted &&
        // 2. Higher overlap ratio
        (v.overlapRatio > bestVerdict.overlapRatio + 0.05 ||
          // 3. Closer centroid distance if overlap ratio similar
          (Math.abs(v.overlapRatio - bestVerdict.overlapRatio) <= 0.05 &&
            v.centroidDist < bestVerdict.centroidDist)));

    if (isBetter) {
      bestTarget = cand;
      bestVerdict = v;
    }
  }

  return { target: bestTarget, verdict: bestVerdict };
}
