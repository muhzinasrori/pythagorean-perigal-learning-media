#!/bin/bash
# Loop through all 10 challenge leg sets and run synthetic drag.
set -e

LEG_SETS=(
  "3 4"
  "6 8"
  "5 12"
  "8 15"
  "9 12"
  "12 16"
  "7 24"
  "20 21"
  "15 20"
  "10 24"
)

echo "=== RUNNING ALL 10 CHALLENGE LEG SETS VIA SYNTHETIC DRAG ==="

for SET in "${LEG_SETS[@]}"; do
  read -r A B <<< "$SET"
  echo "Testing Triangle a=$A, b=$B..."

  for PIECE in 1 2 3 4 a; do
    bash scripts/synthetic-drag.sh "$PIECE" --a "$A" --b "$B"
  done

  RESULT=$(agent-browser eval "document.body.innerText.match(/\\d \\/ 5 pieces/)?.[0]")
  echo "Result for a=$A, b=$B: $RESULT"
  if [[ "$RESULT" != *"5 / 5 pieces"* ]]; then
    echo "FAILED to assemble all pieces for a=$A, b=$B"
    exit 1
  fi
done

echo "✅ ALL 10 CHALLENGE RUNS COMPLETED WITH 5 / 5 PIECES PLACED!"
