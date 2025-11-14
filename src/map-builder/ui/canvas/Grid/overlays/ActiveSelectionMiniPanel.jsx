import React from "react";
import SelectionMiniPanel from "../../SelectionMiniPanel.jsx";
import { clamp } from "../utils.js";

export default function ActiveSelectionMiniPanel({
  selectedObject,
  selectedToken,
  tileSize,
  containerSize,
  currentLayer,
  rows,
  cols,
  gridSettings,
  setGridSettings,
  updateObjectById,
  updateTokenById,
  assets = [],
  objects = {},
}) {
  if (selectedObject) {
    const obj = selectedObject;
    const layerObjects = Array.isArray(objects?.[currentLayer]) ? objects[currentLayer] : [];
    const asset = assets?.find((item) => item.id === obj.assetId);
    const baseName = (obj?.name && obj.name.trim()) || asset?.name || "Object";
    const matchingObjects = layerObjects.filter((item) => item.assetId === obj.assetId);
    const index = matchingObjects.findIndex((item) => item.id === obj.id);
    const title = index >= 0 ? `${baseName} ${index + 1}` : baseName;
    return (
      <SelectionMiniPanel
        key={`obj-${obj.id}`}
        obj={obj}
        tileSize={tileSize}
        containerSize={containerSize}
        title={title}
        onChangeSize={(newW, newH) => {
          const centerRow = obj.row + obj.hTiles / 2;
          const centerCol = obj.col + obj.wTiles / 2;
          const wTiles = Math.max(1, Math.round(newW));
          const hTiles = Math.max(1, Math.round(newH));
          let newRow = Math.round(centerRow - hTiles / 2);
          let newCol = Math.round(centerCol - wTiles / 2);
          newRow = clamp(newRow, 0, Math.max(0, rows - hTiles));
          newCol = clamp(newCol, 0, Math.max(0, cols - wTiles));
          updateObjectById(currentLayer, obj.id, { wTiles, hTiles, row: newRow, col: newCol });
          setGridSettings?.((s) => ({ ...s, sizeCols: wTiles, sizeRows: hTiles }));
        }}
        onRotate={(delta) => {
          const next = ((obj.rotation || 0) + delta) % 360;
          const rotation = next < 0 ? Math.round(next + 360) : Math.round(next);
          updateObjectById(currentLayer, obj.id, { rotation });
          setGridSettings?.((s) => ({ ...s, rotation }));
        }}
        onFlipX={() => {
          updateObjectById(currentLayer, obj.id, { flipX: !obj.flipX });
          setGridSettings?.((s) => ({ ...s, flipX: !obj.flipX }));
        }}
        onFlipY={() => {
          updateObjectById(currentLayer, obj.id, { flipY: !obj.flipY });
          setGridSettings?.((s) => ({ ...s, flipY: !obj.flipY }));
        }}
        opacity={Math.max(0.05, Math.min(1, obj.opacity ?? (gridSettings.opacity ?? 1)))}
        onChangeOpacity={(val) => {
          const opacity = Math.max(0.05, Math.min(1, val || 0));
          updateObjectById(currentLayer, obj.id, { opacity });
          setGridSettings?.((s) => ({ ...s, opacity }));
        }}
        linkXY={!!gridSettings.linkXY}
        onToggleLink={() => setGridSettings?.((s) => ({ ...s, linkXY: !s?.linkXY }))}
      />
    );
  }

  if (selectedToken) {
    const tok = selectedToken;
    const tokenAsset = assets?.find((item) => item.id === tok.assetId);
    const tokenTitle = tok?.name?.trim() || tokenAsset?.name || "Token";
    return (
      <SelectionMiniPanel
        key={`tok-${tok.id}`}
        obj={tok}
        tileSize={tileSize}
        containerSize={containerSize}
        title={tokenTitle}
        onChangeSize={(newW, newH) => {
          const centerRow = tok.row + (tok.hTiles || 1) / 2;
          const centerCol = tok.col + (tok.wTiles || 1) / 2;
          const wTiles = Math.max(1, Math.round(newW));
          const hTiles = Math.max(1, Math.round(newH));
          let newRow = Math.round(centerRow - hTiles / 2);
          let newCol = Math.round(centerCol - wTiles / 2);
          newRow = clamp(newRow, 0, Math.max(0, rows - hTiles));
          newCol = clamp(newCol, 0, Math.max(0, cols - wTiles));
          updateTokenById?.(tok.id, { wTiles, hTiles, row: newRow, col: newCol });
          setGridSettings?.((s) => ({ ...s, sizeCols: wTiles, sizeRows: hTiles }));
        }}
        onRotate={(delta) => {
          const next = ((tok.rotation || 0) + delta) % 360;
          const rotation = next < 0 ? Math.round(next + 360) : Math.round(next);
          updateTokenById?.(tok.id, { rotation });
          setGridSettings?.((s) => ({ ...s, rotation }));
        }}
        onFlipX={() => {
          updateTokenById?.(tok.id, { flipX: !tok.flipX });
          setGridSettings?.((s) => ({ ...s, flipX: !tok.flipX }));
        }}
        onFlipY={() => {
          updateTokenById?.(tok.id, { flipY: !tok.flipY });
          setGridSettings?.((s) => ({ ...s, flipY: !tok.flipY }));
        }}
        opacity={Math.max(0.05, Math.min(1, tok.opacity ?? (gridSettings.opacity ?? 1)))}
        onChangeOpacity={(val) => {
          const opacity = Math.max(0.05, Math.min(1, val || 0));
          updateTokenById?.(tok.id, { opacity });
          setGridSettings?.((s) => ({ ...s, opacity }));
        }}
        linkXY={!!gridSettings.linkXY}
        onToggleLink={() => setGridSettings?.((s) => ({ ...s, linkXY: !s?.linkXY }))}
        highlightColor={tok.glowColor || "#7dd3fc"}
        onChangeHighlightColor={(hex) => {
          const value = typeof hex === "string" && hex.trim() ? hex.trim() : "#7dd3fc";
          updateTokenById?.(tok.id, { glowColor: value });
        }}
      />
    );
  }

  return null;
}
