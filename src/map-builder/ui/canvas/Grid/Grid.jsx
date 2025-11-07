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
    maps,
    objects,
    assets,
    canvasRefs,
    layerVisibility = { background: true, base: true, sky: true },
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
    currentLayer = "base",
    showGridLines = true,
  } = props;

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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cellBg,
  } = useGridController(props);

  return (
    <div className="relative inline-block" style={{ padding: 16 }}>
      <div
        ref={props.contentRef}
        style={{ position: "relative", width: cssWidth, height: cssHeight }}
      >
        <TilesLayer
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
          objects={objects}
          currentLayer={currentLayer}
          selectedObjId={selectedObjId}
          selectedObjIds={selectedObjIds}
          tileSize={tileSize}
          cssWidth={cssWidth}
          cssHeight={cssHeight}
          layerVisibility={layerVisibility}
        />

        {tokensVisible && (
          <TokenSelectionOverlay
            selectedTokenId={selectedTokenId}
            selectedTokenIds={selectedTokenIds}
            getTokenById={getTokenById}
            tileSize={tileSize}
          />
        )}

        <CanvasLayers
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
          tileSize={tileSize}
          containerSize={{ w: cssWidth, h: cssHeight }}
          currentLayer={currentLayer}
          rows={rows}
          cols={cols}
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
          updateObjectById={updateObjectById}
          updateTokenById={updateTokenById}
        />

        <MarqueeOverlay dragState={dragRef.current} tileSize={tileSize} />

        <ZoomToolOverlay active={zoomToolActive} dragState={zoomDragRef.current} />
      </div>
    </div>
  );
}
