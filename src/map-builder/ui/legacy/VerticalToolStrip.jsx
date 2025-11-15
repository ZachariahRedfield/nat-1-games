import React from "react";
import ToolButton from "./modules/toolbar/ToolButton.jsx";
import { useToolstripTips } from "./modules/toolbar/useToolstripTips.js";
import {
  BrushIcon,
  CanvasIcon,
  CursorIcon,
  EraserIcon,
  GridIcon,
  PanIcon,
  SaveIcon,
  TrashIcon,
  ZoomIcon,
} from "./modules/toolbar/icons.jsx";

const FLOATING_PANEL_CLASS =
  "group relative flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 px-1.5 py-1.5 shadow-lg backdrop-blur-lg";

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
    <div className="relative inline-flex flex-col items-center gap-1.5 px-1 py-1 z-[10015] overflow-visible">
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
        <div className="absolute left-full ml-2 top-1 pointer-events-auto flex items-center gap-2">
          <ToolButton
            id="grid"
            label="Grid"
            icon={GridIcon}
            active={engine === "grid"}
            onClick={() => {
              setEngine?.("grid");
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
          />

          <ToolButton
            id="canvas"
            label="Canvas"
            icon={CanvasIcon}
            active={engine === "canvas"}
            onClick={() => {
              if (assetGroup === "token") return;
              setEngine?.("canvas");
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
            inactiveClassName={
              assetGroup === "token"
                ? "text-white/40 cursor-not-allowed"
                : undefined
            }
          />

          <ToolButton
            id="eraser"
            label="Eraser"
            icon={EraserIcon}
            active={isErasing}
            onClick={() => {
              setIsErasing?.((state) => !state);
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
            activeClassName="bg-red-700 text-white"
          />
        </div>
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
        <div className="absolute left-full ml-2 top-[40px] pointer-events-auto flex items-center gap-2">
          <ToolButton
            id="save"
            label="Save"
            icon={SaveIcon}
            active={false}
            disabled={!canActOnSelection}
            onClick={() => {
              if (!canActOnSelection) return;
              onSaveSelection?.();
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
          />

          <ToolButton
            id="delete"
            label="Delete"
            icon={TrashIcon}
            active={false}
            disabled={!canActOnSelection}
            onClick={() => {
              if (!canActOnSelection) return;
              onDeleteSelection?.();
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
          />
        </div>
      )}
    </div>
  );
}
