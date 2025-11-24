import React, { useMemo, useCallback } from "react";
import SelectionPanelFlipControls from "./selection-panel/SelectionPanelFlipControls.jsx";
import SelectionPanelSizeControls from "./selection-panel/SelectionPanelSizeControls.jsx";
import SelectionPanelHighlightControls from "./selection-panel/SelectionPanelHighlightControls.jsx";
import SelectionPanelRotationControls from "./selection-panel/SelectionPanelRotationControls.jsx";
import SelectionPanelOpacityControls from "./selection-panel/SelectionPanelOpacityControls.jsx";
import { useSelectionPanelPosition } from "./selection-panel/useSelectionPanelPosition.js";

const PANEL_WIDTH = 280;
const ROTATION_WHEEL_SIZE = 64;
const OPACITY_SECTION_WIDTH = 240;

export default function SelectionMiniPanel({
  obj,
  tileSize,
  containerSize,
  title = "Object",
  onChangeSize,
  onRotate,
  onFlipX,
  onFlipY,
  opacity = 1,
  onChangeOpacity,
  linkXY = false,
  onToggleLink,
  highlightColor,
  onChangeHighlightColor,
  scrollRef,
  contentRef,
}) {
  const showHighlight = typeof highlightColor === "string" && typeof onChangeHighlightColor === "function";
  const panelHeight = showHighlight ? 196 : 156;
  const panelSize = useMemo(
    () => ({ width: PANEL_WIDTH, height: panelHeight }),
    [panelHeight],
  );

  const safeTileSize = Number.isFinite(tileSize) ? tileSize : 0;
  const { position, onDragStart } = useSelectionPanelPosition({
    obj,
    tileSize: safeTileSize,
    containerSize,
    panelSize,
    scrollRef,
    contentRef,
  });

  const handleSizeCommit = useCallback(
    (newW, newH) => {
      const nextW = Math.max(1, Math.round(newW));
      const nextH = Math.max(1, Math.round(newH));
      onChangeSize?.(nextW, nextH);
    },
    [onChangeSize],
  );

  if (!obj) return null;

  return (
    <div
      className="absolute bg-gray-900/95 text-white border border-gray-700 rounded shadow-lg p-2 relative"
      style={{
        left: position.x,
        top: position.y,
        width: panelSize.width,
        height: panelSize.height,
        zIndex: 10060,
        willChange: "left, top",
      }}
    >
      <div className="text-[11px] font-semibold mb-2 cursor-move select-none" onPointerDown={onDragStart} title="Drag to move">
        {title}
      </div>

      <SelectionPanelFlipControls onFlipX={onFlipX} onFlipY={onFlipY} />

      <SelectionPanelSizeControls obj={obj} linkXY={linkXY} onToggleLink={onToggleLink} onCommit={handleSizeCommit} />

      <SelectionPanelHighlightControls color={highlightColor} onChange={onChangeHighlightColor} />

      <SelectionPanelRotationControls rotation={obj.rotation} onRotate={onRotate} wheelSize={ROTATION_WHEEL_SIZE} />

      <SelectionPanelOpacityControls opacity={opacity} onChange={onChangeOpacity} width={OPACITY_SECTION_WIDTH} />
    </div>
  );
}
