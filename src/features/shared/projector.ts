import { Vec2, vec } from '@/lib/geometry/primitives';
import { Bounds } from '@/lib/geometry/perigal';

/**
 * Projects world coordinates (y up, arbitrary units) into SVG user space
 * (y down), preserving aspect ratio and centering the content with padding.
 * This is the ONLY place where the y-axis flip happens.
 */
export interface Projector {
  toSvg(p: Vec2): Vec2;
  toWorld(p: Vec2): Vec2;
  /** SVG user units per world unit */
  scale: number;
  width: number;
  height: number;
}

export function makeProjector(
  bounds: Bounds,
  width: number,
  height: number,
  padRatio = 0.07,
): Projector {
  const pad = Math.min(width, height) * padRatio;
  const w = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const h = Math.max(bounds.maxY - bounds.minY, 1e-6);
  const scale = Math.min((width - 2 * pad) / w, (height - 2 * pad) / h);
  const offsetX = (width - w * scale) / 2 - bounds.minX * scale;
  // With the y-flip (svgY = offsetY − worldY·scale), world maxY must land at
  // the TOP padding: offsetY = pad + maxY·scale. A centering formula that
  // ignores bounds.maxY silently clips content whenever minY ≠ 0 (our a²
  // square lives below the origin!).
  const offsetY = pad + bounds.maxY * scale;
  return {
    toSvg: (p: Vec2) => vec(p.x * scale + offsetX, offsetY - p.y * scale),
    toWorld: (p: Vec2) => vec((p.x - offsetX) / scale, (offsetY - p.y) / scale),
    scale,
    width,
    height,
  };
}

/**
 * Convert a pointer event position into SVG user-space coordinates.
 * Uses getScreenCTM so letterboxing from preserveAspectRatio is handled
 * correctly on every browser.
 */
export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Vec2 {
  const ctm = svg.getScreenCTM();
  if (!ctm) return vec(0, 0);
  const inv = ctm.inverse();
  return vec(clientX * inv.a + clientY * inv.c + inv.e, clientX * inv.b + clientY * inv.d + inv.f);
}
