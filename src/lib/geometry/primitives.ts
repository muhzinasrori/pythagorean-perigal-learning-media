/**
 * 2D geometry primitives.
 *
 * World convention: x → right, y → UP (standard math orientation).
 * Projection to SVG screen space (y down) happens exclusively in the
 * presentation layer via `makeProjector` (see features/shared/projector.ts).
 *
 * All functions are pure — no DOM, no React. Fully unit-testable.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export const EPS = 1e-9;

export const vec = (x: number, y: number): Vec2 => ({ x, y });

export const add = (p: Vec2, q: Vec2): Vec2 => ({ x: p.x + q.x, y: p.y + q.y });

export const sub = (p: Vec2, q: Vec2): Vec2 => ({ x: p.x - q.x, y: p.y - q.y });

export const mul = (p: Vec2, k: number): Vec2 => ({ x: p.x * k, y: p.y * k });

export const dot = (p: Vec2, q: Vec2): number => p.x * q.x + p.y * q.y;

export const cross = (p: Vec2, q: Vec2): number => p.x * q.y - p.y * q.x;

export const length = (p: Vec2): number => Math.hypot(p.x, p.y);

export const dist = (p: Vec2, q: Vec2): number => Math.hypot(p.x - q.x, p.y - q.y);

export const normalize = (p: Vec2): Vec2 => {
  const l = length(p);
  return l < 1e-12 ? vec(0, 0) : mul(p, 1 / l);
};

/** Rotate point `p` around `center` by `deg` degrees (counter-clockwise in y-up space). */
export const rotateDeg = (p: Vec2, center: Vec2, deg: number): Vec2 => {
  const r = (deg * Math.PI) / 180;
  const s = Math.sin(r);
  const c = Math.cos(r);
  const d = sub(p, center);
  return vec(center.x + d.x * c - d.y * s, center.y + d.x * s + d.y * c);
};

/** Absolute polygon area via the shoelace formula. */
export function polygonArea(poly: Vec2[]): number {
  let s = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

/** Centroid of a simple polygon; falls back to the vertex average when degenerate. */
export function polygonCentroid(poly: Vec2[]): Vec2 {
  const n = poly.length;
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const cr = p.x * q.y - q.x * p.y;
    a += cr;
    cx += (p.x + q.x) * cr;
    cy += (p.y + q.y) * cr;
  }
  a /= 2;
  if (Math.abs(a) < 1e-12) {
    const sx = poly.reduce((acc, p) => acc + p.x, 0);
    const sy = poly.reduce((acc, p) => acc + p.y, 0);
    return vec(sx / n, sy / n);
  }
  return vec(cx / (6 * a), cy / (6 * a));
}

/** Signed side of point `p` relative to the directed line a→b (> 0 means left). */
export function sideOf(a: Vec2, b: Vec2, p: Vec2): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function lineIntersectionOnSegment(a: Vec2, b: Vec2, p: Vec2, q: Vec2): Vec2 {
  const d1 = sideOf(a, b, p);
  const d2 = sideOf(a, b, q);
  const t = d1 / (d1 - d2);
  return vec(p.x + t * (q.x - p.x), p.y + t * (q.y - p.y));
}

/**
 * Sutherland–Hodgman polygon clipping.
 * Keeps the part of `poly` that lies on the LEFT of the directed line a→b
 * (points exactly on the line count as inside — required so that cuts through
 * vertices never drop them).
 */
export function clipHalfPlane(poly: Vec2[], a: Vec2, b: Vec2): Vec2[] {
  const out: Vec2[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % n];
    const d1 = sideOf(a, b, cur);
    const d2 = sideOf(a, b, nxt);
    if (d1 >= -EPS) {
      out.push(cur);
      if (d2 < -EPS) out.push(lineIntersectionOnSegment(a, b, cur, nxt));
    } else if (d2 > EPS) {
      out.push(lineIntersectionOnSegment(a, b, cur, nxt));
    }
  }
  return out;
}

function pointOnSegment(p: Vec2, a: Vec2, b: Vec2, tol: number): boolean {
  const cr = sideOf(a, b, p);
  if (Math.abs(cr) > tol * Math.max(1, dist(a, b))) return false;
  const withinX = Math.min(a.x, b.x) - tol <= p.x && p.x <= Math.max(a.x, b.x) + tol;
  const withinY = Math.min(a.y, b.y) - tol <= p.y && p.y <= Math.max(a.y, b.y) + tol;
  return withinX && withinY;
}

/** Ray-casting point-in-polygon test, boundary-inclusive up to `tol`. */
export function pointInPolygon(pt: Vec2, poly: Vec2[], tol = 1e-7): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    if (pointOnSegment(pt, p, q, tol)) return true;
    if (p.y > pt.y !== q.y > pt.y) {
      const xAt = ((q.x - p.x) * (pt.y - p.y)) / (q.y - p.y) + p.x;
      if (pt.x < xAt) inside = !inside;
    }
  }
  return inside;
}

/** Build an SVG path string from already-projected points. */
export function toPathString(poly: Vec2[], decimals = 3): string {
  if (poly.length === 0) return '';
  const body = poly
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(decimals)} ${p.y.toFixed(decimals)}`)
    .join(' ');
  return `${body} Z`;
}

/** Unit direction of the longest edge of a CCW polygon (unique-length assumption). */
export function longestEdgeDirection(poly: Vec2[]): Vec2 {
  let best = -1;
  let dir = vec(1, 0);
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const l = dist(p, q);
    if (l > best + EPS) {
      best = l;
      dir = normalize(sub(q, p));
    }
  }
  return dir;
}

/** Signed angle in degrees needed to rotate `from` onto `to` (−180..180). */
export function angleBetweenDeg(from: Vec2, to: Vec2): number {
  const a = normalize(from);
  const b = normalize(to);
  return (Math.atan2(cross(a, b), dot(a, b)) * 180) / Math.PI;
}

export const round = (n: number, decimals = 2): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/** Trim floating point noise for display: 8.999999 → "9". */
export function fmt(n: number, decimals = 2): string {
  const r = round(n, decimals);
  return Number.isInteger(r) ? String(r) : String(round(n, decimals));
}
