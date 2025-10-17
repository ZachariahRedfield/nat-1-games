import React from "react";

export default function BrushPreview({
  engine,
  layerIsVisible,
  mousePos,
  brushSize,
  tileSize,
  selectedAsset,
}) {
  if (!(engine === "canvas" && layerIsVisible && mousePos)) return null;
  return (
    <div
      className="absolute rounded-full border border-white pointer-events-none"
      style={{
        left: mousePos.x - brushSize * tileSize * 0.5,
        top: mousePos.y - brushSize * tileSize * 0.5,
        width: brushSize * tileSize,
        height: brushSize * tileSize,
        zIndex: 99,
        backgroundColor:
          selectedAsset?.kind === "image" ? "transparent" : "rgba(255,255,255,0.1)",
      }}
    />
  );
}

