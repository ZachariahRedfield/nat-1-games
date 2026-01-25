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
  dragState,
  isDraggingSelection,
  showTransformControls = true,
}) {
  const getObjectById = (layer, id) => (objects[layer] || []).find((o) => o.id === id);

  const ids = Array.isArray(selectedObjIds) && selectedObjIds.length
    ? selectedObjIds
    : (selectedObjId ? [selectedObjId] : []);
  const layerIds = layers
    .map((layer) => (typeof layer === "string" ? layer : layer?.id))
    .filter(Boolean);

  const isMultiSelection = ids.length > 1;
  const hideSelectionDecorations =
    isDraggingSelection &&
    dragState &&
    (dragState.kind === "object" || dragState.kind === "multi-object");

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
              if (hideSelectionDecorations) return null;
              const w = sel.wTiles * tileSize;
              const h = sel.hTiles * tileSize;
              const cx = (sel.col + sel.wTiles / 2) * tileSize;
              const cy = (sel.row + sel.hTiles / 2) * tileSize;
              const rot = sel.rotation || 0;
              const baseZ = 12 + i * 20;
              const sz = 8; // px handle square
              const handlePositions = [
                { key: 'nw', left: 0, top: 0 },
                { key: 'ne', left: '100%', top: 0 },
                { key: 'sw', left: 0, top: '100%' },
                { key: 'se', left: '100%', top: '100%' },
              ];
              const halfW = w / 2;
              const halfH = h / 2;
              const ringRadius = Math.sqrt(halfW * halfW + halfH * halfH) + 8; // a bit outside corners
              const ringDiameter = ringRadius * 2;

              return (
                <React.Fragment key={`sel-${layer}-${sel.id}`}>
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: cx,
                      top: cy,
                      width: w,
                      height: h,
                      zIndex: baseZ - 1,
                      transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                      transformOrigin: "center",
                      border: "2px dashed #4ade80",
                      outline: "1px solid rgba(74,222,128,0.35)",
                      willChange: "transform",
                    }}
                  >
                    {showTransformControls &&
                      !isMultiSelection &&
                      handlePositions.map((pos) => (
                        <div
                          key={`hdl-${sel.id}-${pos.key}`}
                          className="absolute bg-emerald-400 shadow pointer-events-none"
                          style={{
                            left: pos.left,
                            top: pos.top,
                            width: sz,
                            height: sz,
                            transform: "translate(-50%, -50%)",
                            zIndex: baseZ,
                            borderRadius: 2,
                          }}
                        />
                      ))}
                  </div>

                  {showTransformControls && !isMultiSelection && arr.length === 1 && (
                    <div
                      key={`rot-ring-${sel.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: cx - ringRadius,
                        top: cy - ringRadius,
                        width: ringDiameter,
                        height: ringDiameter,
                        zIndex: baseZ,
                        borderRadius: "50%",
                        border: "2px solid rgba(59,130,246,0.55)", // blue-ish ring
                        willChange: "transform",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
