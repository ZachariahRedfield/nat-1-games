import React from "react";

export default function BrushPreview({
  engine,
  layerIsVisible,
  mousePos,
  brushSize,
  tileSize,
  selectedAsset,
  isErasing,
}) {
  if (!(engine === "canvas" && layerIsVisible && mousePos)) return null;
  return (
    <div
      className="absolute rounded-full border pointer-events-none"
      style={{
        left: mousePos.x - brushSize * tileSize * 0.5,
        top: mousePos.y - brushSize * tileSize * 0.5,
        width: brushSize * tileSize,
        height: brushSize * tileSize,
        zIndex: 99,
        borderColor: isErasing ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)',
        borderStyle: isErasing ? 'dashed' : 'solid',
        backgroundColor:
          isErasing
            ? 'rgba(239,68,68,0.12)'
            : (selectedAsset?.kind === "image" ? "transparent" : "rgba(255,255,255,0.1)"),
      }}
    />
  );
}
