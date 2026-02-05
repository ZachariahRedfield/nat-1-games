import React from "react";
import TilesLayer from "./TilesLayer";
import ObjectsLayer from "./ObjectsLayer";
import SelectionOverlay from "./SelectionOverlay";
import TokenLayer from "./TokenLayer";
import CanvasLayers from "./CanvasLayers";
import BrushPreview from "./BrushPreview";
import PointerOverlay from "./PointerOverlay";
import TokenSelectionOverlay from "./overlays/TokenSelectionOverlay.jsx";
import MarqueeOverlay from "./overlays/MarqueeOverlay.jsx";
import ZoomToolOverlay from "./overlays/ZoomToolOverlay.jsx";
import useGridController from "./useGridController.js";

export default function Grid(props) {
  const {
    layers = [],
    maps,
    objects,
    assets,
    canvasRefs,
    layerVisibility: layerVisibilityProp = {},
    tokens = [],
    tokensVisible = true,
    tokenHUDVisible = true,
    tokenHUDShowInitiative = false,
    tileSize = 32,
    engine,
    selectedAsset,
    brushSize = 2,
    isErasing = false,
    gridSettings,
    setGridSettings,
    updateObjectById,
    updateTokenById,
    zoomToolActive = false,
    interactionMode = "draw",
    currentLayer: currentLayerProp,
    showGridLines = true,
    contentRef,
    scrollRef,
  } = props;

  const currentLayer = currentLayerProp ?? layers[0]?.id ?? null;
  const layerVisibility = {
    ...layers.reduce((acc, layer) => {
      acc[layer.id] = layerVisibilityProp?.[layer.id] !== false;
      return acc;
    }, {}),
  };

  const {
    rows,
    cols,
    cssWidth,
    cssHeight,
    bufferWidth,
    bufferHeight,
    layerIsVisible,
    mousePos,
    cursorStyle,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    getTokenById,
    dragRef,
    zoomDragRef,
    isSelectionDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cellBg,
  } = useGridController({
    ...props,
    layers,
    currentLayer,
    layerVisibility,
  });
  const capturePadding = React.useMemo(() => {
    const basePadding = Math.max(16, Math.round(tileSize));
    const selectedIds = Array.isArray(selectedObjIds) && selectedObjIds.length
      ? selectedObjIds
      : selectedObjId
        ? [selectedObjId]
        : [];
    const tokenIds = Array.isArray(selectedTokenIds) && selectedTokenIds.length
      ? selectedTokenIds
      : selectedTokenId
        ? [selectedTokenId]
        : [];
    if (!selectedIds.length && !tokenIds.length) return basePadding;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const paddingBuffer = 12;
    const recordBounds = (col, row, wTiles = 1, hTiles = 1) => {
      const width = wTiles * tileSize;
      const height = hTiles * tileSize;
      const cx = (col + wTiles / 2) * tileSize;
      const cy = (row + hTiles / 2) * tileSize;
      const radius = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2) + paddingBuffer;
      minX = Math.min(minX, cx - radius);
      maxX = Math.max(maxX, cx + radius);
      minY = Math.min(minY, cy - radius);
      maxY = Math.max(maxY, cy + radius);
    };

    const layerObjects = Array.isArray(objects?.[currentLayer]) ? objects[currentLayer] : [];
    for (const id of selectedIds) {
      const obj = layerObjects.find((item) => item.id === id);
      if (!obj) continue;
      recordBounds(obj.col ?? 0, obj.row ?? 0, obj.wTiles ?? 1, obj.hTiles ?? 1);
    }

    for (const id of tokenIds) {
      const token = Array.isArray(tokens) ? tokens.find((item) => item.id === id) : null;
      if (!token) continue;
      recordBounds(token.col ?? 0, token.row ?? 0, token.wTiles ?? 1, token.hTiles ?? 1);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return basePadding;

    const leftOverflow = Math.max(0, 0 - minX);
    const topOverflow = Math.max(0, 0 - minY);
    const rightOverflow = Math.max(0, maxX - cssWidth);
    const bottomOverflow = Math.max(0, maxY - cssHeight);
    const overflow = Math.max(leftOverflow, topOverflow, rightOverflow, bottomOverflow, basePadding);
    return Math.ceil(overflow);
  }, [
    cssHeight,
    cssWidth,
    currentLayer,
    objects,
    selectedObjId,
    selectedObjIds,
    selectedTokenId,
    selectedTokenIds,
    tileSize,
    tokens,
  ]);

  return (
    <div className="relative inline-block" style={{ padding: 16 }}>
      {/* Extend pointer capture beyond the grid so resize/rotate handles work outside the bounds. */}
      <div ref={contentRef} style={{ position: "relative", width: cssWidth, height: cssHeight }}>
        <TilesLayer
          layers={layers}
          maps={maps}
          rows={rows}
          cols={cols}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
          showGridLines={showGridLines}
          cellBg={cellBg}
        />

        <ObjectsLayer
          layers={layers}
          objects={objects}
          assets={assets}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        <TokenLayer
          tokens={tokens}
          assets={assets}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          visible={tokensVisible}
          showHUD={tokenHUDVisible}
          showInitiative={tokenHUDShowInitiative}
        />

        <SelectionOverlay
          layers={layers}
          objects={objects}
          currentLayer={currentLayer}
          selectedObjId={selectedObjId}
          selectedObjIds={selectedObjIds}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
          dragState={dragRef.current}
          isDraggingSelection={isSelectionDragging}
          showTransformControls={interactionMode === "select"}
        />

        {tokensVisible && (
          <TokenSelectionOverlay
            selectedTokenId={selectedTokenId}
            selectedTokenIds={selectedTokenIds}
            getTokenById={getTokenById}
            tileSize={tileSize}
            dragState={dragRef.current}
            isDraggingSelection={isSelectionDragging}
            showTransformControls={interactionMode === "select"}
          />
        )}

        <CanvasLayers
          layers={layers}
          canvasRefs={canvasRefs}
          bufferWidth={bufferWidth}
          bufferHeight={bufferHeight}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        <BrushPreview
          engine={engine}
          layerIsVisible={layerIsVisible}
          mousePos={mousePos}
          brushSize={brushSize}
          tileSize={tileSize}
          selectedAsset={selectedAsset}
          isErasing={isErasing}
        />

        <PointerOverlay
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          cursorStyle={cursorStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          capturePadding={capturePadding}
        />

        <MarqueeOverlay dragState={dragRef.current} tileSize={tileSize} />

        <ZoomToolOverlay active={zoomToolActive} dragState={zoomDragRef.current} />
      </div>
    </div>
  );
}
