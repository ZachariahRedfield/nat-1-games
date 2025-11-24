import React from "react";
import TilesLayer from "./TilesLayer";
import ObjectsLayer from "./ObjectsLayer";
import SelectionOverlay from "./SelectionOverlay";
import TokenLayer from "./TokenLayer";
import CanvasLayers from "./CanvasLayers";
import BrushPreview from "./BrushPreview";
import PointerOverlay from "./PointerOverlay";
import TokenSelectionOverlay from "./overlays/TokenSelectionOverlay.jsx";
import ActiveSelectionMiniPanel from "./overlays/ActiveSelectionMiniPanel.jsx";
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
    getSelectedObject,
    getSelectedToken,
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

  return (
    <div className="relative inline-block" style={{ padding: 16 }}>
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
        />

        {tokensVisible && (
          <TokenSelectionOverlay
            selectedTokenId={selectedTokenId}
            selectedTokenIds={selectedTokenIds}
            getTokenById={getTokenById}
            tileSize={tileSize}
            dragState={dragRef.current}
            isDraggingSelection={isSelectionDragging}
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
        />

        <ActiveSelectionMiniPanel
          selectedObject={getSelectedObject()}
          selectedToken={getSelectedToken()}
          selectedObjIds={selectedObjIds}
          tileSize={tileSize}
          containerSize={{ w: cssWidth, h: cssHeight }}
          currentLayer={currentLayer}
          rows={rows}
          cols={cols}
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
          updateObjectById={updateObjectById}
          updateTokenById={updateTokenById}
          assets={assets}
          objects={objects}
          scrollRef={scrollRef}
          contentRef={contentRef}
        />

        <MarqueeOverlay dragState={dragRef.current} tileSize={tileSize} />

        <ZoomToolOverlay active={zoomToolActive} dragState={zoomDragRef.current} />
      </div>
    </div>
  );
}
