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
  "group relative flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 px-1 py-1 shadow-lg backdrop-blur-lg";
const SMALL_TOOL_BUTTON_CLASS = "w-[26px] h-[26px]";
const SMALL_TOOL_ICON_CLASS = "w-3.5 h-3.5";

const createSmallIcon = (IconComponent) => (props) => (
  <IconComponent {...props} className={`${SMALL_TOOL_ICON_CLASS} ${props?.className ?? ""}`} />
);

const SmallGridIcon = createSmallIcon(GridIcon);
const SmallCanvasIcon = createSmallIcon(CanvasIcon);
const SmallEraserIcon = createSmallIcon(EraserIcon);
const SmallSaveIcon = createSmallIcon(SaveIcon);
const SmallTrashIcon = createSmallIcon(TrashIcon);

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
            icon={SmallGridIcon}
            active={engine === "grid"}
            onClick={() => {
              setEngine?.("grid");
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
            className={SMALL_TOOL_BUTTON_CLASS}
          />

          <ToolButton
            id="canvas"
            label="Canvas"
            icon={SmallCanvasIcon}
            active={engine === "canvas"}
            onClick={() => {
              if (assetGroup === "token") return;
              setEngine?.("canvas");
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
            className={SMALL_TOOL_BUTTON_CLASS}
            inactiveClassName={
              assetGroup === "token"
                ? "text-white/40 cursor-not-allowed"
                : undefined
            }
          />

          <ToolButton
            id="eraser"
            label="Eraser"
            icon={SmallEraserIcon}
            active={isErasing}
            onClick={() => {
              setIsErasing?.((state) => !state);
            }}
            showTip={showTip}
            iconClassFor={iconClassFor}
            labelClassFor={labelClassFor}
            wrapperClassName={FLOATING_PANEL_CLASS}
            activeClassName="bg-red-700 text-white"
            className={SMALL_TOOL_BUTTON_CLASS}
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
            icon={SmallSaveIcon}
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
            className={SMALL_TOOL_BUTTON_CLASS}
          />

          <ToolButton
            id="delete"
            label="Delete"
            icon={SmallTrashIcon}
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
            className={SMALL_TOOL_BUTTON_CLASS}
          />
        </div>
      )}
    </div>
  );
}
