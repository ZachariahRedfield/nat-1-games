import React from "react";

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
}) {
  const [renamingId, setRenamingId] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");

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

  return (
    <div className="w-full z-[10020] bg-gray-800 text-white px-2 py-1 border-b border-gray-700 shadow">
      <div className="flex items-center gap-3 flex-wrap">
        {canRemoveActiveLayer && (
          <button
            type="button"
            className="px-2 py-0.5 text-xs rounded border border-red-400 text-red-300 hover:text-red-200 hover:border-red-300 transition"
            title={`Remove ${activeLayer?.name || "layer"}`}
            onClick={handleRemoveActiveLayer}
          >
            ×
          </button>
        )}
        <span className="text-[11px] uppercase opacity-80 mr-2">Layers</span>

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

          return (
            <div key={`layerbar-${layer.id}`} className="flex items-center gap-1">
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
                  className={buttonClasses}
                  title={isHidden ? `${layer.name} (hidden)` : layer.name}
                >
                  {layer.name}
                </button>
              )}
            </div>
          );
        })}

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
          />
          <span className="text-[11px] w-10 text-right">{Math.round((tileSize / 32) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
