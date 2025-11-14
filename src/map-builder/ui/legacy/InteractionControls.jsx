import React from "react";

// Inline icons (kept minimal to avoid extra deps)
const BrushIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 12c2 0 3-.8 3-2l5.2-5.2 2 2L7 12c-.8.8-2 .9-3 .9H2z" />
    <path d="M10 2l4 4 1-1c.6-.6.6-1.4 0-2l-2-2c-.6-.6-1.4-.6-2 0l-1 1z" />
  </svg>
);
const CursorIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 2l8 6-4 1 1 4-2 1-1-4-4-1z" />
  </svg>
);
const EraserIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 10l5-5 4 4-5 5H3l-2-2 4-4z" />
    <path d="M7 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);
const GridIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
  </svg>
);
const CanvasIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M8 2c1.2 2 4 4 4 7a4 4 0 11-8 0c0-3 2.8-5 4-7z" />
  </svg>
);
const SaveIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h9l3 3v9H2z" />
    <path d="M4 2h6v4H4zM4 11h8v2H4z" fill="currentColor" />
  </svg>
);
const ZoomIcon = ({ className = "w-3 h-3" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const segmentedButtonClass = (isActive) =>
  `px-1.5 py-0.5 text-[11px] font-medium relative group inline-flex items-center justify-center gap-1 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
    isActive
      ? "bg-blue-500 text-white shadow-inner"
      : "text-white/80 hover:text-white hover:bg-white/10"
  }`;

const toggleButtonClass = (isActive) =>
  `px-2 py-0.5 text-[11px] font-medium relative group inline-flex items-center gap-1 rounded-lg border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
    isActive
      ? "border-red-500 bg-red-600/90 text-white shadow-inner"
      : "border-slate-600/70 bg-slate-900/60 text-white/80 hover:text-white hover:bg-white/10"
  }`;

const primaryButtonClass = (enabled) =>
  `px-2 py-0.5 text-[11px] font-medium relative group inline-flex items-center gap-1 rounded-lg border transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
    enabled
      ? "border-amber-500 bg-amber-500/90 text-white hover:bg-amber-400"
      : "cursor-not-allowed border-slate-700 bg-slate-900/50 text-white/60"
  }`;

const tooltipClass =
  "absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 pointer-events-none";

export default function InteractionControls({
  interactionMode,
  setInteractionMode,
  zoomToolActive,
  setZoomToolActive,
  assetGroup,
  engine,
  setEngine,
  isErasing,
  setIsErasing,
  canSave = false,
  onSaveClick,
}) {
  return (
    <>
      {/* Row 1: Mode segmented (+ Zoom Tool at right; mutually exclusive) */}
      <div className="inline-flex items-center gap-0 overflow-hidden rounded-xl border border-slate-600/80 bg-slate-900/60 shadow-sm backdrop-blur">
        <button
          onClick={() => { setZoomToolActive(false); setInteractionMode("draw"); }}
          title="Draw"
          aria-label="Draw"
          className={segmentedButtonClass(!zoomToolActive && interactionMode === "draw")}
        >
          <BrushIcon className="w-3 h-3" />
          <div className={tooltipClass}>Draw</div>
        </button>
        <button
          onClick={() => { setZoomToolActive(false); setInteractionMode("select"); }}
          title="Select"
          aria-label="Select"
          className={segmentedButtonClass(!zoomToolActive && interactionMode === "select")}
        >
          <CursorIcon className="w-3 h-3" />
          <div className={tooltipClass}>Select</div>
        </button>
        <button
          className={segmentedButtonClass(zoomToolActive)}
          onClick={() => setZoomToolActive((v)=> !v)}
          title="Zoom Tool: drag a rectangle to zoom"
          aria-label="Zoom Tool"
        >
          <ZoomIcon className="w-3 h-3" />
          <div className={tooltipClass}>Zoom Tool</div>
        </button>
      </div>

      {/* Row 2: Context */}
      <div className="mt-2 flex items-center gap-2">
        {interactionMode === 'draw' ? (
          <>
            {assetGroup !== 'token' && (
              <div className="inline-flex items-center gap-0 overflow-hidden rounded-xl border border-slate-600/80 bg-slate-900/60 shadow-sm backdrop-blur">
                <button
                  onClick={() => setEngine("grid")}
                  title="Grid"
                  aria-label="Grid"
                  className={segmentedButtonClass(engine === "grid")}
                >
                  <GridIcon className="w-3 h-3" />
                  <div className={tooltipClass}>Grid</div>
                </button>
                <button
                  onClick={() => setEngine("canvas")}
                  title="Canvas"
                  aria-label="Canvas"
                  className={segmentedButtonClass(engine === "canvas")}
                >
                  <CanvasIcon className="w-3 h-3" />
                  <div className={tooltipClass}>Canvas</div>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsErasing((s) => !s)}
              className={toggleButtonClass(isErasing)}
              title={`Eraser: ${isErasing ? 'On' : 'Off'}`}
              aria-label={`Eraser: ${isErasing ? 'On' : 'Off'}`}
            >
              <EraserIcon className="w-3 h-3" />
              <span className="hidden text-xs font-medium sm:inline">Eraser</span>
              <div className={tooltipClass}>Eraser: {isErasing ? 'On' : 'Off'}</div>
            </button>
          </>
        ) : (
          <button
            onClick={onSaveClick}
            disabled={!canSave}
            className={primaryButtonClass(canSave)}
            title="Save selected as a new asset"
            aria-label="Save"
          >
            <span className="inline-flex items-center gap-2">
              <SaveIcon className="w-3 h-3" />
              <span className="text-xs">Save</span>
            </span>
            <div className={tooltipClass}>Save</div>
          </button>
        )}
      </div>
    </>
  );
}

