#!/bin/bash
# Drag a puzzle piece to its slot in the speed challenge (3-4-5 triangle).
# Usage: drag-piece.sh <pieceId> where pieceId ∈ {1,2,3,4,a}
ID="$1"
case "$ID" in
  1) RX=-0.625; RY=1.375;  TX=3.625; TY=1.375 ;;
  2) RX=-1.375; RY=3.375;  TX=5.625; TY=3.625 ;;
  3) RX=-3.375; RY=2.625;  TX=3.375; TY=5.625 ;;
  4) RX=-2.375; RY=0.625;  TX=1.375; TY=3.375 ;;
  a) RX=1.5;    RY=-1.5;   TX=3.5;   TY=3.5   ;;
  *) echo "unknown piece"; exit 1 ;;
esac
COORDS=$(agent-browser eval "(() => {
  const svg=document.querySelector('svg[role=application]');
  const r=svg.getBoundingClientRect();
  const a=3,b=4,c=5;
  const bounds={minX:-b,minY:-a,maxX:a+b,maxY:a+b};
  const W=1000,H=760,pad=38;
  const sc=Math.min((W-2*pad)/(bounds.maxX-bounds.minX),(H-2*pad)/(bounds.maxY-bounds.minY));
  const ox=(W-(bounds.maxX-bounds.minX)*sc)/2-bounds.minX*sc;
  const oy=pad+bounds.maxY*sc;
  const toScreen=(wx,wy)=>[r.x+((wx*sc+ox)/W)*r.width, r.y+((oy-wy*sc)/H)*r.height];
  const [px,py]=toScreen($RX,$RY);
  const [tx,ty]=toScreen($TX,$TY);
  return [px,py,tx,ty].map(Math.round).join(' ');
})()" | tr -d '"')
set -- $COORDS
agent-browser mouse move $1 $2
agent-browser mouse down left
agent-browser wait 250
agent-browser mouse move $3 $4
agent-browser wait 250
agent-browser mouse up left
agent-browser wait 900
agent-browser eval "'placed: ' + document.body.innerText.match(/\d \/ 5 pieces/)?.[0]"
