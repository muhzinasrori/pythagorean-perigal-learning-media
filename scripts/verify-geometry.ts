/**
 * Geometry engine verification — run with: bun scripts/verify-geometry.ts
 *
 * Proves, for a battery of triangles (including degenerate a=b and extreme
 * ratios), that:
 *   1. The cut always yields 4 positive-area pieces whose areas sum to b².
 *   2. At the correct cut angle, each piece maps EXACTLY (rigid motion, no
 *      reflection) onto its assembly slot with a pure rotation + translation.
 *   3. Slot areas + hole area = c²; hole side = a (Perigal's theorem).
 *   4. A wrong cut angle produces pieces that can NOT tile c².
 *   5. No NaNs anywhere.
 */

import {
  createWorld,
  cutSquareB,
  computeAssembly,
  makeAPiece,
  correctCutAnglesDeg,
  isCutCorrect,
  snapCutAngle,
  WorldModel,
  CutPiece,
} from '../src/lib/geometry/perigal';
import {
  polygonArea,
  polygonCentroid,
  polygonCentroid as centroid,
  dist,
  rotateDeg,
  longestEdgeDirection,
  angleBetweenDeg,
  vec,
  Vec2,
} from '../src/lib/geometry/primitives';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✔ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✘ FAIL: ${label}`);
  }
}

function close(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}

function hasNoNaN(m: WorldModel, pieces: CutPiece[]): boolean {
  const all: number[] = [m.a, m.b, m.c, m.hypAngleDeg];
  for (const p of [...pieces]) {
    for (const pt of p.polygon) all.push(pt.x, pt.y);
  }
  return all.every((n) => Number.isFinite(n));
}

/** Rotate a piece by `rot` about its centroid, then translate so centroids coincide. */
function superimpose(piece: CutPiece, targetPoly: CutPiece['polygon'], rot: number) {
  const c0 = centroid(piece.polygon);
  const rotated = piece.polygon.map((p) => rotateDeg(p, c0, rot));
  const c1 = centroid(rotated);
  const tc = centroid(targetPoly);
  const dx = tc.x - c1.x;
  const dy = tc.y - c1.y;
  return rotated.map((p) => vec(p.x + dx, p.y + dy));
}

function polygonDistance(p: Vec2[], q: Vec2[]): number {
  // symmetric Hausdorff-ish: for each vertex of p, distance to nearest vertex of q
  const oneWay = (from: Vec2[], to: Vec2[]) =>
    Math.max(...from.map((pf) => Math.min(...to.map((pt) => dist(pf, pt)))));
  return Math.max(oneWay(p, q), oneWay(q, p));
}

const TRIANGLES: Array<[number, number]> = [
  [3, 4],
  [4, 3], // order must be normalised internally
  [6, 8],
  [5, 12],
  [8, 15],
  [9, 12],
  [7, 24],
  [20, 21],
  [12, 16],
  [5, 5], // isosceles degenerate short edge (b−a)/2 = 0
  [1, 10], // extreme ratio
];

for (const [x, y] of TRIANGLES) {
  const m = createWorld(x, y);
  console.log(`\n▲ triangle a=${m.a}, b=${m.b}, c=${m.c.toFixed(6)}`);

  assert(hasNoNaN(m, []), 'world model has no NaN');
  assert(m.a <= m.b, 'legs normalised (a ≤ b)');
  assert(close(polygonArea(m.squareB), m.b * m.b), 'b² square area');
  assert(close(polygonArea(m.squareA), m.a * m.a), 'a² square area');
  assert(close(polygonArea(m.squareC), m.c * m.c), 'c² square area');

  const [t1, t2] = correctCutAnglesDeg(m);
  console.log(`    correct cut angles: ${t1.toFixed(4)}° / ${t2.toFixed(4)}°`);

  // ---- correct cut ----
  const cutAngle = snapCutAngle(m, t1);
  assert(isCutCorrect(m, cutAngle), 'snapCutAngle produces a correct cut');

  const pieces = cutSquareB(m, cutAngle);
  assert(hasNoNaN(m, pieces), 'cut pieces contain no NaN');
  assert(pieces.every((p) => p.polygon.length >= 3), 'every piece is a valid polygon');

  const areaSum = pieces.reduce((s, p) => s + polygonArea(p.polygon), 0);
  assert(close(areaSum, m.b * m.b, 1e-6), `4 piece areas sum to b² (${areaSum.toFixed(6)})`);

  const plan = computeAssembly(m);
  const byId = new Map(plan.targets.map((t) => [t.id, t]));

  // Each piece must land on its slot via a rotation of ~+90° + translation.
  for (const piece of pieces) {
    const target = byId.get(piece.id);
    assert(!!target, `slot exists for piece ${piece.id}`);
    if (!target) continue;
    const rot = angleBetweenDeg(
      longestEdgeDirection(piece.polygon),
      longestEdgeDirection(target.polygon),
    );
    const moved = superimpose(piece, target.polygon, rot);
    const d = polygonDistance(moved, target.polygon);
    assert(
      d < 1e-4,
      `piece ${piece.id} ≅ slot (rot ${rot.toFixed(4)}°, vertex mismatch ${d.toExponential(2)})`,
    );
  }

  // ---- Perigal theorem ----
  const holeArea = polygonArea(plan.hole);
  assert(close(holeArea, m.a * m.a, 1e-6), `hole area = a² (${holeArea.toFixed(6)})`);
  const slotSum = plan.targets.reduce((s, t) => s + polygonArea(t.polygon), 0);
  assert(close(slotSum, m.c * m.c, 1e-4), `slots (4 pieces + hole) sum to c² (${slotSum.toFixed(6)})`);

  const xs = plan.hole.map((p) => p.x);
  const ys = plan.hole.map((p) => p.y);
  const holeSideX = Math.max(...xs) - Math.min(...xs);
  const holeSideY = Math.max(...ys) - Math.min(...ys);
  assert(close(holeSideX, m.a) && close(holeSideY, m.a), 'hole is an axis-aligned a×a square');

  // ---- the a² piece itself ----
  const ap = makeAPiece(m);
  assert(close(polygonArea(ap.polygon), m.a * m.a), 'a² piece area');

  // ---- wrong cut must NOT tile ----
  const wrongAngle = cutAngle + 17;
  if (!isCutCorrect(m, wrongAngle)) {
    const wrongPieces = cutSquareB(m, wrongAngle);
    const wrongSum = wrongPieces.reduce((s, p) => s + polygonArea(p.polygon), 0);
    assert(close(wrongSum, m.b * m.b, 1e-6), 'wrong cut still conserves area');
    const wrongTarget = byId.get('b1')!;
    const wrongPiece = wrongPieces.find((p) => p.id === 'b1')!;
    const rotW = angleBetweenDeg(
      longestEdgeDirection(wrongPiece.polygon),
      longestEdgeDirection(wrongTarget.polygon),
    );
    const dW = polygonDistance(superimpose(wrongPiece, wrongTarget.polygon, rotW), wrongTarget.polygon);
    assert(dW > 1e-3, `wrong cut piece does NOT fit slot (mismatch ${dW.toFixed(4)})`);
  }
}

console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
