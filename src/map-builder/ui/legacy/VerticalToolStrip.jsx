import React from "react";
import { useToolstripTips } from "./modules/toolbar/useToolstripTips.js";
import ToolStack from "./modules/toolbar/ToolStack.jsx";
import { CanvasIcon, CursorIcon, EraserIcon, GridIcon, PanIcon, ZoomIcon } from "./modules/toolbar/icons.jsx";
import ToolButton from "./modules/toolbar/ToolButton.jsx";

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
}) {
  const { showTip, iconClassFor, labelClassFor } = useToolstripTips();
  const drawActive = !zoomToolActive && !panToolActive && interactionMode === "draw";
  const selectActive = !zoomToolActive && !panToolActive && interactionMode === "select";
  const gridActive = drawActive && engine === "grid";
  const canvasActive = drawActive && engine === "canvas";

  const toolItems = [
    {
      id: "stamp",
      label: "Stamp",
      icon: GridIcon,
      active: gridActive,
      onSelect: () => {
        setZoomToolActive(false);
        setPanToolActive(false);
        setInteractionMode("draw");
        setEngine("grid");
      },
    },
    {
      id: "canvas",
      label: "Canvas",
      icon: CanvasIcon,
      active: canvasActive,
      disabled: assetGroup === "token",
      onSelect: () => {
        if (assetGroup === "token") return;
        setZoomToolActive(false);
        setPanToolActive(false);
        setInteractionMode("draw");
        setEngine("canvas");
      },
    },
    {
      id: "select",
      label: "Select",
      icon: CursorIcon,
      active: selectActive,
      onSelect: () => {
        setZoomToolActive(false);
        setPanToolActive(false);
        setInteractionMode("select");
      },
    },
    {
      id: "pan",
      label: "Pan",
      icon: PanIcon,
      active: panToolActive,
      onSelect: () => {
        setPanToolActive(true);
        setZoomToolActive(false);
      },
    },
    {
      id: "zoom",
      label: "Zoom",
      icon: ZoomIcon,
      active: zoomToolActive,
      onSelect: () => {
        setZoomToolActive(true);
        setPanToolActive(false);
      },
    },
  ];

  return (
    <div className="relative inline-flex flex-col items-center gap-1.5 px-1 py-1 z-[10015] overflow-visible max-sm:gap-1 max-sm:px-0.5 max-sm:py-0.5">
      <ToolStack
        items={toolItems}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        menuLabel="Interaction tools"
      />

      {drawActive && (
        <ToolButton
          id="eraser"
          label="Eraser"
          icon={EraserIcon}
          active={isErasing}
          onClick={() => setIsErasing?.((state) => !state)}
          showTip={showTip}
          iconClassFor={iconClassFor}
          labelClassFor={labelClassFor}
          activeClassName="bg-red-700 text-white"
        />
      )}
    </div>
  );
}
