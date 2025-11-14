import React from "react";

export default function CanvasLayers({
  layers = [],
  canvasRefs,
  bufferWidth,
  bufferHeight,
  cssWidth,
  cssHeight,
  layerVisibility,
}) {
  const layerIds = layers
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);
  return (
    <>
      {layerIds.map((layer, i) => (
        <canvas
          key={`canvas-${layer}`}
          ref={canvasRefs?.[layer]}
          width={bufferWidth}
          height={bufferHeight}
          style={{
            width: cssWidth,
            height: cssHeight,
            zIndex: 12 + i * 20,
            display: layerVisibility[layer] ? "block" : "none",
          }}
          className="absolute top-0 left-0 pointer-events-none"
        />
      ))}
    </>
  );
}

