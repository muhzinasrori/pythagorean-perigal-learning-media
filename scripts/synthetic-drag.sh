#!/bin/bash
# Synthetic pointer drag of a puzzle piece to its slot (deterministic,
# browser-independent). Usage: synthetic-drag.sh <piece:1|2|3|4|a>
ID="$1"
agent-browser eval "(() => {
  const svg = document.querySelector('svg[role=application]');
  const r = svg.getBoundingClientRect();
  const a = 3, b = 4, c = 5;
  const bounds = { minX: -b, minY: -a, maxX: a + b, maxY: a + b };
  const W = 1000, H = 760, pad = 38;
  const sc = Math.min((W - 2*pad)/(bounds.maxX-bounds.minX), (H - 2*pad)/(bounds.maxY-bounds.minY));
  const ox = (W-(bounds.maxX-bounds.minX)*sc)/2 - bounds.minX*sc;
  const oy = pad + bounds.maxY*sc;
  const ts = (wx, wy) => [r.x+((wx*sc+ox)/W)*r.width, r.y+((oy-wy*sc)/H)*r.height];
  const REST = { 1: [-0.625,1.375], 2: [-1.375,3.375], 3: [-3.375,2.625], 4: [-2.375,0.625], a: [1.5,-1.5] }[$ID];
  const SLOT = { 1: [3.625,1.375], 2: [5.625,3.625], 3: [3.375,5.625], 4: [1.375,3.375], a: [3.5,3.5] }[$ID];
  const [rx, ry] = ts(REST[0], REST[1]);
  const [tx, ty] = ts(SLOT[0], SLOT[1]);
  const g = [...document.querySelectorAll('svg g[aria-label]')].find(x => x.getAttribute('aria-label').includes('piece ${ID}'));
  if (!g) return 'NO-PIECE';
  const fire = (type, x, y, buttons) => {
    g.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId: 7,
      pointerType: 'mouse', isPrimary: true, buttons, clientX: x, clientY: y,
    }));
  };
  fire('pointerdown', rx, ry, 1);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    fire('pointermove', rx + ((tx-rx)*i)/steps, ry + ((ty-ry)*i)/steps, 1);
  }
  fire('pointerup', tx, ty, 0);
  return 'synthetic-drag-${ID}-done';
})()"
sleep 1
agent-browser eval "'placed: ' + document.body.innerText.match(/\d \/ 5 pieces/)?.[0]"
