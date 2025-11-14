import React from "react";

export default function TilesLayer({
  layers = [],
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
  const layerIds = layers
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);
  return (
    <>
      {layerIds.map((layer, i) => {
        const grid = maps?.[layer] || [];
        return (
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
              {grid.map((rowArr, ri) =>
                rowArr.map((val, ci) => (
                  <div
                    key={`${layer}-${ri}-${ci}`}
                    style={{
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: cellBg(val),
                      border: showGridLines ? "0.5px solid rgba(75,85,99,0.65)" : "none",
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
