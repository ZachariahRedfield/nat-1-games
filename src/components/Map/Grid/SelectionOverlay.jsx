import React from "react";
import { LAYERS } from "./utils";

export default function SelectionOverlay({
  objects,
  currentLayer,
  selectedObjId,
  selectedObjIds = [],
  tileSize,
  cssWidth,
  cssHeight,
  layerVisibility,
}) {
  const getObjectById = (layer, id) => (objects[layer] || []).find((o) => o.id === id);

  const ids = Array.isArray(selectedObjIds) && selectedObjIds.length
    ? selectedObjIds
    : (selectedObjId ? [selectedObjId] : []);

  return (
    <>
      {LAYERS.map((layer, i) => {
        if (layer !== currentLayer || !layerVisibility[layer]) return null;
        const arr = ids
          .map((id) => getObjectById(layer, id))
          .filter(Boolean);
        if (!arr.length) return null;
        return (
          <React.Fragment key={`sels-${layer}`}>
            {arr.map((sel) => {
              const left = sel.col * tileSize;
              const top = sel.row * tileSize;
              const w = sel.wTiles * tileSize;
              const h = sel.hTiles * tileSize;
              return (
                <div
                  key={`sel-${layer}-${sel.id}`}
                  className="absolute pointer-events-none"
                  style={{
                    left,
                    top,
                    width: w,
                    height: h,
                    zIndex: 12 + i * 20 - 1,
                    border: "2px dashed #4ade80",
                    boxShadow: "0 0 0 2px rgba(74,222,128,0.3) inset",
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
