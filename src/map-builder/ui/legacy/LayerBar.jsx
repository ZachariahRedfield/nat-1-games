import React from "react";

const FitToScreenIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3.5 6V3.5H6" />
    <path d="M13 6V3.5H10.5" />
    <path d="M3.5 10V12.5H6" />
    <path d="M13 10V12.5H10.5" />
    <path d="M3.5 3.5l2.5 2.5" />
    <path d="M13 3.5l-2.5 2.5" />
    <path d="M3.5 12.5l2.5-2.5" />
    <path d="M13 12.5l-2.5-2.5" />
  </svg>
);

function normalizeLayers(layers = []) {
  return layers
    .map((layer) =>
      typeof layer === "string" ? { id: layer, name: layer } : layer
    )
    .filter((layer) => !!layer?.id);
}

export default function LayerBar({
  layers = [],
  currentLayer,
  setCurrentLayer,
  addLayer,
  renameLayer,
  removeLayer,
  layerVisibility,
  toggleLayerVisibility,
  showGridLines,
  setShowGridLines,
  tileSize,
  setTileSize,
  reorderLayer,
  onZoomToFit,
}) {
  const [renamingId, setRenamingId] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragTarget, setDragTarget] = React.useState(null);

  const layerEntries = React.useMemo(
    () => normalizeLayers(layers),
    [layers]
  );

  const activeLayer = layerEntries.find((layer) => layer.id === currentLayer);
  const finishRename = React.useCallback(
    (commit) => {
      if (renamingId) {
        if (commit) renameLayer?.(renamingId, draftName);
        setRenamingId(null);
        setDraftName("");
      }
    },
    [draftName, renamingId, renameLayer]
  );

  const activeLayerVisible = layerVisibility?.[currentLayer] !== false;
  const toggleLabel = activeLayerVisible ? "Hide Layer" : "Show Layer";
  const canRemoveActiveLayer = layerEntries.length > 1 && !!currentLayer;

  const handleRemoveActiveLayer = React.useCallback(() => {
    if (!canRemoveActiveLayer) return;
    finishRename(false);
    removeLayer?.(currentLayer);
  }, [canRemoveActiveLayer, currentLayer, finishRename, removeLayer]);

  const handleAddLayer = React.useCallback(() => {
    finishRename(false);
    addLayer?.();
  }, [addLayer, finishRename]);

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null);
    setDragTarget(null);
  }, []);

  const handleDragStart = React.useCallback((event, layerId) => {
    if (!layerId) return;
    setDraggingId(layerId);
    setDragTarget(null);
    event.dataTransfer?.setData?.("text/plain", layerId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }, []);

  const handleDragOverItem = React.useCallback(
    (event, layerId) => {
      if (!draggingId || draggingId === layerId) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const position = event.clientX - rect.left > rect.width / 2 ? "after" : "before";
      setDragTarget((prev) => {
        if (prev && prev.id === layerId && prev.position === position) {
          return prev;
        }
        return { id: layerId, position };
      });
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    },
    [draggingId],
  );

  const handleDragOverEnd = React.useCallback(
    (event) => {
      if (!draggingId) return;
      event.preventDefault();
      setDragTarget((prev) => {
        if (prev && prev.id === null) {
          return prev;
        }
        return { id: null, position: "after" };
      });
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    },
    [draggingId],
  );

  const handleDrop = React.useCallback(
    (event, fallbackId = null) => {
      if (!draggingId) return;
      event.preventDefault();
      const sourceIndex = layerEntries.findIndex((layer) => layer.id === draggingId);
      if (sourceIndex < 0) {
        handleDragEnd();
        return;
      }

      let targetId = dragTarget?.id;
      let position = dragTarget?.position;

      if (!targetId && fallbackId) {
        targetId = fallbackId;
      }

      if (targetId && !position) {
        const rect = event.currentTarget.getBoundingClientRect();
        position = event.clientX - rect.left > rect.width / 2 ? "after" : "before";
      }

      let targetIndex;
      if (targetId == null) {
        targetIndex = layerEntries.length;
      } else {
        const overIndex = layerEntries.findIndex((layer) => layer.id === targetId);
        if (overIndex < 0) {
          handleDragEnd();
          return;
        }
        targetIndex = overIndex + (position === "after" ? 1 : 0);
      }

      if (sourceIndex < targetIndex) {
        targetIndex -= 1;
      }

      targetIndex = Math.max(0, Math.min(layerEntries.length - 1, targetIndex));

      if (targetIndex !== sourceIndex) {
        reorderLayer?.(draggingId, targetIndex);
      }

      handleDragEnd();
    },
    [dragTarget, draggingId, handleDragEnd, layerEntries, reorderLayer],
  );

  const dropIndicatorClass = "absolute top-[-4px] bottom-[-4px] w-1 bg-blue-400 pointer-events-none";

  return (
    <div className="w-full z-[10020] bg-gray-800 text-white px-2 py-1 border-b border-gray-700 shadow">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] uppercase opacity-80 mr-2">Layers</span>

        {canRemoveActiveLayer && (
          <button
            type="button"
            className="ml-1 px-2 py-0.5 text-xs rounded border border-red-400 text-red-300 hover:text-red-200 hover:border-red-300 transition"
            title={`Remove ${activeLayer?.name || "layer"}`}
            onClick={handleRemoveActiveLayer}
          >
            Remove
          </button>
        )}

        <button
          type="button"
          className="px-2 py-0.5 text-xs rounded-full border border-dashed border-white/60 text-white/80 hover:border-white/90 hover:text-white transition"
          onClick={handleAddLayer}
        >
          + Add Layer
        </button>

        {layerEntries.map((layer) => {
          const isActive = layer.id === currentLayer;
          const isHidden = layerVisibility?.[layer.id] === false;
          const isEditing = renamingId === layer.id;
          const buttonClasses = [
            "px-2 py-0.5 text-sm rounded-full border transition",
            "border-white/80",
            isActive ? "bg-blue-600 text-white border-blue-400" : "text-gray-300 hover:text-white",
            isHidden ? "opacity-60" : "",
          ].join(" ");

          const showBefore = dragTarget?.id === layer.id && dragTarget?.position === "before";
          const showAfter = dragTarget?.id === layer.id && dragTarget?.position === "after";

          return (
            <div
              key={`layerbar-${layer.id}`}
              className={`relative flex items-center gap-1 ${draggingId === layer.id ? "opacity-70" : ""}`}
              draggable={!isEditing}
              onDragStart={(event) => handleDragStart(event, layer.id)}
              onDragOver={(event) => handleDragOverItem(event, layer.id)}
              onDrop={(event) => handleDrop(event, layer.id)}
              onDragEnd={handleDragEnd}
            >
              {showBefore && <span className={dropIndicatorClass} style={{ left: -4 }} />}
              {isEditing ? (
                <input
                  className="px-2 py-0.5 text-sm rounded-full border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={() => finishRename(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") finishRename(true);
                    else if (event.key === "Escape") finishRename(false);
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentLayer(layer.id)}
                  onDoubleClick={(event) => {
                    event.preventDefault();
                    finishRename(false);
                    setRenamingId(layer.id);
                    setDraftName(layer.name);
                  }}
                  className={`${buttonClasses} cursor-grab active:cursor-grabbing`}
                  title={isHidden ? `${layer.name} (hidden)` : layer.name}
                >
                  {layer.name}
                </button>
              )}
              {showAfter && <span className={dropIndicatorClass} style={{ right: -4 }} />}
            </div>
          );
        })}

        <div className="w-4 h-6" onDragOver={handleDragOverEnd} onDrop={(event) => handleDrop(event, null)} />

        <button
          type="button"
          disabled={!currentLayer}
          className={`px-2 py-0.5 text-[12px] rounded-full border border-white/90 bg-gray-700 ${!currentLayer ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={() => currentLayer && toggleLayerVisibility(currentLayer)}
          title={toggleLabel}
        >
          {toggleLabel}
        </button>

        <div className="h-4 w-px bg-gray-600 mx-1" />

        <button
          type="button"
          className="px-2 py-0.5 text-[12px] rounded-full border border-white/90 bg-gray-700"
          onClick={() => setShowGridLines((value) => !value)}
          title={showGridLines ? "Hide Grid" : "Show Grid"}
        >
          {showGridLines ? "Hide Grid" : "Show Grid"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={`p-1 rounded-full border border-white/60 text-white/80 hover:text-white hover:border-white transition ${
              onZoomToFit ? "" : "opacity-40 cursor-not-allowed"
            }`}
            onClick={() => {
              if (!onZoomToFit) return;
              onZoomToFit();
            }}
            title="Fit map to view"
            disabled={!onZoomToFit}
          >
            <FitToScreenIcon />
          </button>
          <span className="text-[11px] opacity-80">Zoom</span>
          <input
            type="range"
            min="8"
            max="128"
            step="2"
            value={tileSize}
            onChange={(event) =>
              setTileSize(
                Math.max(
                  8,
                  Math.min(
                    128,
                    Math.round(parseInt(event.target.value, 10) / 2) * 2
                  )
                )
              )
            }
            title="Zoom level"
          />
          <span className="text-[11px] w-10 text-right">{Math.round((tileSize / 32) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
