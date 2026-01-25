import React from "react";
import { CanvasIcon, EraserIcon, GridIcon } from "./icons.jsx";
import { segmentedButtonClass, toggleButtonClass, tooltipClass } from "./styles.js";

export default function DrawContextControls({
  assetGroup,
  engine,
  setEngine,
  isErasing,
  setIsErasing,
}) {
  return (
    <>
      {assetGroup !== "token" && (
        <div className="inline-flex items-center gap-0 overflow-hidden rounded-xl border border-slate-600/80 shadow-sm backdrop-blur">
          <button
            onClick={() => setEngine("grid")}
            title="Grid"
            aria-label="Grid"
            className={segmentedButtonClass(engine === "grid")}
          >
            <GridIcon className="w-2 h-2" />
            <div className={tooltipClass}>Grid</div>
          </button>
          <button
            onClick={() => setEngine("canvas")}
            title="Canvas"
            aria-label="Canvas"
            className={segmentedButtonClass(engine === "canvas")}
          >
            <CanvasIcon className="w-2 h-2" />
            <div className={tooltipClass}>Canvas</div>
          </button>
        </div>
      )}
      <button
        onClick={() => setIsErasing((s) => !s)}
        className={toggleButtonClass(isErasing)}
        title={`Eraser: ${isErasing ? "On" : "Off"}`}
        aria-label={`Eraser: ${isErasing ? "On" : "Off"}`}
      >
        <EraserIcon className="w-2 h-2" />
        <span className="hidden text-[8px] font-medium sm:inline">Eraser</span>
        <div className={tooltipClass}>Eraser: {isErasing ? "On" : "Off"}</div>
      </button>
    </>
  );
}
