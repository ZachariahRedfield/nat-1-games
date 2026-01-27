import React from "react";
import ToolButton from "./modules/toolbar/ToolButton.jsx";
import { useToolstripTips } from "./modules/toolbar/useToolstripTips.js";
import { BrushIcon, CursorIcon, PanIcon, ZoomIcon } from "./modules/toolbar/icons.jsx";
import {
  DrawModeToolGroup,
  SelectModeToolGroup,
} from "./modules/toolbar/groups/index.js";

export default function VerticalToolStrip({
  interactionMode,
  zoomToolActive,
  panToolActive,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  isErasing,
  setIsErasing,
  engine,
  setEngine,
  assetGroup,
  canActOnSelection,
  onSaveSelection,
  onDeleteSelection,
}) {
  const { showTip, iconClassFor, labelClassFor } = useToolstripTips();
  const drawActive = !zoomToolActive && !panToolActive && interactionMode === "draw";
  const selectActive = !zoomToolActive && !panToolActive && interactionMode === "select";

  return (
    <div className="relative inline-flex flex-col items-center gap-1.5 px-1 py-1 z-[10015] overflow-visible max-sm:gap-1 max-sm:px-0.5 max-sm:py-0.5">
      <ToolButton
        id="draw"
        label="Draw"
        icon={BrushIcon}
        active={drawActive}
        onClick={() => {
          setZoomToolActive(false);
          setPanToolActive(false);
          setInteractionMode("draw");
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
      />

      {drawActive && (
        <DrawModeToolGroup
          engine={engine}
          assetGroup={assetGroup}
          isErasing={isErasing}
          setEngine={setEngine}
          setIsErasing={setIsErasing}
          showTip={showTip}
          iconClassFor={iconClassFor}
          labelClassFor={labelClassFor}
        />
      )}

      <ToolButton
        id="select"
        label="Select"
        icon={CursorIcon}
        active={selectActive}
        onClick={() => {
          setZoomToolActive(false);
          setPanToolActive(false);
          setInteractionMode("select");
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
      />

      <ToolButton
        id="pan"
        label="Pan"
        icon={PanIcon}
        active={panToolActive}
        onClick={() => {
          setPanToolActive(true);
          setZoomToolActive(false);
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
      />

      <ToolButton
        id="zoom"
        label="Zoom"
        icon={ZoomIcon}
        active={zoomToolActive}
        onClick={() => {
          setZoomToolActive(true);
          setPanToolActive(false);
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
      />

      {selectActive && (
        <SelectModeToolGroup
          canActOnSelection={canActOnSelection}
          onSaveSelection={onSaveSelection}
          onDeleteSelection={onDeleteSelection}
          showTip={showTip}
          iconClassFor={iconClassFor}
          labelClassFor={labelClassFor}
          showSelectionActions={false}
        />
      )}
    </div>
  );
}
