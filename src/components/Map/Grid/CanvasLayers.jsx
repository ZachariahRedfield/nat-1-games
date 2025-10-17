import React from "react";
import { LAYERS } from "./utils";

export default function CanvasLayers({
  canvasRefs,
  bufferWidth,
  bufferHeight,
  cssWidth,
  cssHeight,
  layerVisibility,
}) {
  return (
    <>
      {LAYERS.map((layer, i) => (
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

