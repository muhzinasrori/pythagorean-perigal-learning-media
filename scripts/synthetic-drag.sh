#!/bin/bash
# Synthetic pointer drag of a puzzle piece to its compatible slot.
# Usage: synthetic-drag.sh <piece:1|2|3|4|a> [--a 3] [--b 4]
set -e

A=3
B=4
ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --a) A="$2"; shift 2 ;;
    --b) B="$2"; shift 2 ;;
    1|2|3|4|a) ID="$1"; shift ;;
    *) shift ;;
  esac
done

if [ -z "$ID" ]; then
  echo "Usage: synthetic-drag.sh <1|2|3|4|a> [--a <num>] [--b <num>]"
  exit 1
fi

agent-browser eval "(() => {
  const svg = document.querySelector('svg[role=application]');
  if (!svg) return 'NO-SVG';
  const r = svg.getBoundingClientRect();
  const a = $A, b = $B, c = Math.hypot(a, b);
  const bounds = { minX: -b, minY: -a, maxX: a + b, maxY: a + b };
  const W = 1000, H = 760, pad = 38;
  const sc = Math.min((W - 2*pad)/(bounds.maxX-bounds.minX), (H - 2*pad)/(bounds.maxY-bounds.minY));
  const ox = (W-(bounds.maxX-bounds.minX)*sc)/2 - bounds.minX*sc;
  const oy = pad + bounds.maxY*sc;
  const ts = (wx, wy) => [r.x + ((wx*sc + ox)/W)*r.width, r.y + ((oy - wy*sc)/H)*r.height];

  // Helper geometry
  const s = (b - a) / 2;
  const L = (a + b) / 2;
  const K1 = { x: a, y: 0 };
  const K2 = { x: a + b, y: a };
  const M = { x: (a + b) / 2, y: (a + b) / 2 };
  const d1 = { x: (K2.x - K1.x) / c, y: (K2.y - K1.y) / c };

  const rot90 = (p, center) => ({
    x: center.x - (p.y - center.y),
    y: center.y + (p.x - center.x),
  });

  // Slot 1: corner K1
  const A1 = { x: K1.x + d1.x * (c / 2), y: K1.y + d1.y * (c / 2) };
  const B1 = { x: A1.x, y: A1.y + s };
  const C1 = { x: B1.x - L, y: B1.y };
  const t1 = [K1, A1, B1, C1];
  const t2 = t1.map(p => rot90(p, M));
  const t3 = t2.map(p => rot90(p, M));
  const t4 = t3.map(p => rot90(p, M));

  const polyCentroid = (pts) => {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i+1)%pts.length];
      const cr = p.x * q.y - q.x * p.y;
      a += cr; cx += (p.x + q.x) * cr; cy += (p.y + q.y) * cr;
    }
    a /= 2;
    return [cx / (6 * a), cy / (6 * a)];
  };

  const slotCentroids = {
    1: polyCentroid(t1),
    2: polyCentroid(t2),
    3: polyCentroid(t3),
    4: polyCentroid(t4),
    a: [M.x, M.y],
  };

  // Congruent pieces map without rotation to:
  // piece 1 -> slot 4
  // piece 2 -> slot 1
  // piece 3 -> slot 2
  // piece 4 -> slot 3
  // piece a -> slot a
  const targetSlotKey = { '1': '4', '2': '1', '3': '2', '4': '3', 'a': 'a' }['$ID'];
  const targetWorld = slotCentroids[targetSlotKey];
  const [tx, ty] = ts(targetWorld[0], targetWorld[1]);

  const g = [...document.querySelectorAll('svg g[aria-label]')].find(x => x.getAttribute('aria-label').includes('piece $ID'));
  if (!g) return 'NO-PIECE';
  const circle = g.querySelector('circle');
  const cx = parseFloat(circle.getAttribute('cx'));
  const cy = parseFloat(circle.getAttribute('cy'));
  const rx = r.x + (cx / W) * r.width;
  const ry = r.y + (cy / H) * r.height;

  const fire = (type, x, y, buttons) => {
    g.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId: 7,
      pointerType: 'mouse', isPrimary: true, buttons, clientX: x, clientY: y,
    }));
  };

  fire('pointerdown', rx, ry, 1);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    fire('pointermove', rx + ((tx - rx) * i) / steps, ry + ((ty - ry) * i) / steps, 1);
  }
  fire('pointerup', tx, ty, 0);
  return 'synthetic-drag-$ID-done';
})()"
sleep 0.5
agent-browser eval "'placed: ' + (document.body.innerText.match(/\\d \\/ 5 pieces/)?.[0] ?? 'none')"
