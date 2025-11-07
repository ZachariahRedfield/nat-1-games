import React from "react";

export default function MarqueeOverlay({ dragState, tileSize }) {
  if (!dragState) return null;
  if (!(dragState.kind === "marquee-obj" || dragState.kind === "marquee-token")) return null;

  const { startRow, startCol, curRow, curCol } = dragState;
  const left = Math.min(startCol, curCol) * tileSize;
  const top = Math.min(startRow, curRow) * tileSize;
  const width = Math.abs(curCol - startCol) * tileSize;
  const height = Math.abs(curRow - startRow) * tileSize;

  return (
    <div
      className="absolute pointer-events-none border border-blue-400/70 bg-blue-400/10"
      style={{ left, top, width, height, zIndex: 9999 }}
    />
  );
}
