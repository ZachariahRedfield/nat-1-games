import React from "react";
import { LAYERS } from "./utils";

export default function TilesLayer({
  maps,
  rows,
  cols,
  tileSize,
  cssWidth,
  cssHeight,
  layerVisibility,
  showGridLines = true,
  cellBg,
}) {
  return (
    <>
      {LAYERS.map((layer, i) => (
        <div
          key={`tiles-${layer}`}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: cssWidth,
            height: cssHeight,
            zIndex: 10 + i * 20,
            display: layerVisibility[layer] ? "block" : "none",
          }}
        >
          <div
            className="grid"
            style={{
              width: cssWidth,
              height: cssHeight,
              gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
              gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
            }}
          >
            {maps[layer].map((rowArr, ri) =>
              rowArr.map((val, ci) => (
                <div
                  key={`${layer}-${ri}-${ci}`}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: cellBg(val),
                    border: showGridLines ? '0.5px solid rgba(75,85,99,0.65)' : 'none',
                  }}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </>
  );
}
