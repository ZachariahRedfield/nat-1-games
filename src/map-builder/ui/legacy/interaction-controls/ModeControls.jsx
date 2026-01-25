import React from "react";
import { BrushIcon, CursorIcon, ZoomIcon } from "./icons.jsx";
import { segmentedButtonClass, tooltipClass } from "./styles.js";

export default function ModeControls({
  interactionMode,
  setInteractionMode,
  zoomToolActive,
  setZoomToolActive,
}) {
  const handleModeClick = (mode) => {
    setZoomToolActive(false);
    setInteractionMode(mode);
  };

  return (
    <div className="inline-flex items-center gap-0 overflow-hidden rounded-xl border border-slate-600/80 shadow-sm backdrop-blur">
      <button
        onClick={() => handleModeClick("draw")}
        title="Draw"
        aria-label="Draw"
        className={segmentedButtonClass(!zoomToolActive && interactionMode === "draw")}
      >
        <BrushIcon className="w-2 h-2" />
        <div className={tooltipClass}>Draw</div>
      </button>
      <button
        onClick={() => handleModeClick("select")}
        title="Select"
        aria-label="Select"
        className={segmentedButtonClass(!zoomToolActive && interactionMode === "select")}
      >
        <CursorIcon className="w-2 h-2" />
        <div className={tooltipClass}>Select</div>
      </button>
      <button
        className={segmentedButtonClass(zoomToolActive)}
        onClick={() => setZoomToolActive((v) => !v)}
        title="Zoom Tool: drag a rectangle to zoom"
        aria-label="Zoom Tool"
      >
        <ZoomIcon className="w-2 h-2" />
        <div className={tooltipClass}>Zoom Tool</div>
      </button>
    </div>
  );
}
