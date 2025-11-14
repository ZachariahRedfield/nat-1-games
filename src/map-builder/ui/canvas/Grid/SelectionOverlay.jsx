import React from "react";

export default function SelectionOverlay({
  layers = [],
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
  const layerIds = layers
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);

  return (
    <>
      {layerIds.map((layer, i) => {
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
            {/* corner handles (visual only; input handled in Grid) */}
            {arr.map((sel) => {
              const left = sel.col * tileSize;
              const top = sel.row * tileSize;
              const w = sel.wTiles * tileSize;
              const h = sel.hTiles * tileSize;
              const sz = 8; // px handle square
              const half = Math.floor(sz / 2);
              const corners = [
                { key: 'nw', x: left, y: top },
                { key: 'ne', x: left + w, y: top },
                { key: 'sw', x: left, y: top + h },
                { key: 'se', x: left + w, y: top + h },
              ];
              return corners.map((c) => (
                <div
                  key={`hdl-${sel.id}-${c.key}`}
                  className="absolute bg-emerald-400 shadow pointer-events-none"
                  style={{
                    left: c.x - half,
                    top: c.y - half,
                    width: sz,
                    height: sz,
                    zIndex: 12 + i * 20,
                    borderRadius: 2,
                  }}
                />
              ));
            })}

            {/* rotation ring (single selection only) */}
            {arr.length === 1 && arr.map((sel) => {
              const cx = (sel.col + sel.wTiles / 2) * tileSize;
              const cy = (sel.row + sel.hTiles / 2) * tileSize;
              const rx = (sel.wTiles * tileSize) / 2;
              const ry = (sel.hTiles * tileSize) / 2;
              const r = Math.sqrt(rx * rx + ry * ry) + 8; // a bit outside corners
              const d = r * 2;
              return (
                <div
                  key={`rot-ring-${sel.id}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: cx - r,
                    top: cy - r,
                    width: d,
                    height: d,
                    zIndex: 12 + i * 20,
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px rgba(59,130,246,0.55) inset', // blue-ish ring
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
