/**
 * Placement engine verification — run with: npx tsx scripts/verify-placement.ts
 *
 * Verifies that:
 *   1. Every piece evaluates 'accepted' when dropped exactly on its slot.
 *   2. A b-piece dropped at the center of c² returns 'too-far'.
 *   3. A piece rotated +180° returns 'wrong-rotation'.
 *   4. A mirrored piece returns 'needs-flip'.
 *   5. A b-piece dropped on a DIFFERENT b-slot with correct orientation returns 'accepted'.
 *   6. No NaNs anywhere across all 10 challenge triangles + alternate cut angle.
 */

import {
  createWorld,
  cutSquareB,
  computeAssembly,
  makeAPiece,
  correctCutAnglesDeg,
  WorldModel,
  CutPiece,
  PieceId,
} from '../src/lib/geometry/perigal';
import {
  evaluatePlacement,
  bestSlotFor,
  rigidAlignment,
  transformPieceToWorld,
  normalizeAngleDeg,
} from '../src/lib/geometry/placement';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✔ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✘ FAIL: ${label}`);
  }
}

const TRIANGLES: Array<[number, number]> = [
  [3, 4],
  [6, 8],
  [5, 12],
  [8, 15],
  [9, 12],
  [12, 16],
  [7, 24],
  [20, 21],
  [15, 20],
  [10, 24],
];

console.log('--- RUNNING PLACEMENT VERIFICATION SUITE ---');

for (const [a, b] of TRIANGLES) {
  const m = createWorld(a, b);
  const [t1, t2] = correctCutAnglesDeg(m);
  const angles = a === 3 && b === 4 ? [t1, t2] : [t1];

  for (const angle of angles) {
    const isAlt = angle === t2 ? ' (alternate angle)' : '';
    console.log(`\n▲ Triangle a=${m.a}, b=${m.b}, c=${m.c.toFixed(4)}${isAlt}`);

    const pieces: CutPiece[] = [...cutSquareB(m, angle), makeAPiece(m)];
    const plan = computeAssembly(m);
    const targetMap = new Map(plan.targets.map((t) => [t.id, t]));
    const snapRad = Math.max(0.7, m.a * 0.32);

    // 1. Every piece evaluates 'accepted' when dropped on its own slot
    for (const piece of pieces) {
      const target = targetMap.get(piece.id)!;
      const align = rigidAlignment(piece.polygon, target.polygon);
      const rot = align.unmirrored.rotDeg;
      const dx = target.centroid.x - piece.centroid.x;
      const dy = target.centroid.y - piece.centroid.y;

      const verdict = evaluatePlacement(piece, target, {
        dx: dx * 100,
        dy: -dy * 100,
        rot: -rot, // SVG rot convention
        scale: 100, // Pass scale to test SVG conversion
        snapRadius: snapRad,
      });

      assert(verdict.accepted, `piece ${piece.id} accepted on own slot`);
      assert(verdict.reason === 'ok', `piece ${piece.id} reason is 'ok'`);
      assert(verdict.overlapRatio >= 0.98, `piece ${piece.id} overlap ratio ≥ 0.98 (${verdict.overlapRatio.toFixed(3)})`);
      assert(Number.isFinite(verdict.overlapRatio) && !Number.isNaN(verdict.overlapRatio), 'no NaN in overlapRatio');
      assert(Number.isFinite(verdict.corrective.dx) && !Number.isNaN(verdict.corrective.dx), 'no NaN in corrective');
    }

    // 2. A b-piece dropped at the centre of c² returns 'too-far'
    const bPiece = pieces[0];
    const centerDx = m.centerC.x - bPiece.centroid.x;
    const centerDy = m.centerC.y - bPiece.centroid.y;
    const centerBest = bestSlotFor(bPiece, plan.targets, {
      dx: centerDx * 100,
      dy: -centerDy * 100,
      rot: 0,
      scale: 100,
      snapRadius: snapRad,
    });
    assert(centerBest !== null, 'center drop finds candidate slot');
    assert(centerBest?.verdict.accepted === false, 'center drop rejected');
    assert(centerBest?.verdict.reason === 'too-far', `center drop reason is 'too-far' (got '${centerBest?.verdict.reason}')`);

    // 3. A piece rotated +180° returns 'wrong-rotation'
    const targetB1 = targetMap.get(bPiece.id)!;
    const alignB1 = rigidAlignment(bPiece.polygon, targetB1.polygon);
    const correctRot = alignB1.unmirrored.rotDeg;
    const wrongRot = normalizeAngleDeg(correctRot + 180);
    const rotVerdict = evaluatePlacement(bPiece, targetB1, {
      dx: (targetB1.centroid.x - bPiece.centroid.x) * 100,
      dy: -(targetB1.centroid.y - bPiece.centroid.y) * 100,
      rot: -wrongRot,
      scale: 100,
      snapRadius: snapRad,
    });
    assert(!rotVerdict.accepted, '180° rotated piece rejected');
    assert(rotVerdict.reason === 'wrong-rotation', `180° rotated piece reason is 'wrong-rotation' (got '${rotVerdict.reason}')`);

    // 4. A mirrored piece returns 'needs-flip'
    const mirrorVerdict = evaluatePlacement(bPiece, targetB1, {
      dx: (targetB1.centroid.x - bPiece.centroid.x) * 100,
      dy: -(targetB1.centroid.y - bPiece.centroid.y) * 100,
      rot: -correctRot,
      flip: true,
      scale: 100,
      snapRadius: snapRad,
    });
    assert(!mirrorVerdict.accepted, 'mirrored piece rejected');
    assert(mirrorVerdict.reason === 'needs-flip', `mirrored piece reason is 'needs-flip' (got '${mirrorVerdict.reason}')`);

    // 5. A b-piece dropped on a DIFFERENT b-slot (correct orientation for that slot) returns accepted
    const otherTarget = plan.targets.find((t) => t.id !== 'a' && t.id !== bPiece.id)!;
    const otherAlign = rigidAlignment(bPiece.polygon, otherTarget.polygon);
    const otherRot = otherAlign.unmirrored.rotDeg;
    const otherVerdict = evaluatePlacement(bPiece, otherTarget, {
      dx: (otherTarget.centroid.x - bPiece.centroid.x) * 100,
      dy: -(otherTarget.centroid.y - bPiece.centroid.y) * 100,
      rot: -otherRot,
      scale: 100,
      snapRadius: snapRad,
    });
    assert(otherVerdict.accepted, `b-piece accepted on different b-slot ${otherTarget.id}`);
    assert(otherVerdict.reason === 'ok', `b-piece on slot ${otherTarget.id} reason is 'ok'`);
  }
}

console.log(`\nVerification finished with ${failures} failure(s).`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL VERIFY-PLACEMENT TESTS PASSED PERFECTLY!');
}
