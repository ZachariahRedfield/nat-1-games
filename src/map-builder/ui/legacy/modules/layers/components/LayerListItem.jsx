import React from "react";

export function LayerListItem({
  layer,
  isActive,
  isHidden,
  isEditing,
  dropIndicatorClass,
  showBefore,
  showAfter,
  draftName,
  setDraftName,
  finishRename,
  onSelectLayer,
  onBeginRename,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const buttonClasses = React.useMemo(
    () =>
      [
        "px-2 py-0.5 text-sm rounded-full border transition",
        "border-white/80",
        isActive ? "bg-blue-600 text-white border-blue-400" : "text-gray-300 hover:text-white",
        isHidden ? "opacity-60" : "",
      ].join(" "),
    [isActive, isHidden],
  );

  return (
    <div
      className={`relative flex items-center gap-1 max-sm:shrink-0 ${draggingId === layer.id ? "opacity-70" : ""}`}
      draggable={!isEditing}
      onDragStart={(event) => onDragStart(event, layer.id)}
      onDragOver={(event) => onDragOver(event, layer.id)}
      onDrop={(event) => onDrop(event, layer.id)}
      onDragEnd={onDragEnd}
    >
      {showBefore && <span className={dropIndicatorClass} style={{ left: -4 }} />}
      {isEditing ? (
        <input
          className="px-2 py-0.5 text-[11px] sm:text-sm rounded-full border border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          onClick={() => onSelectLayer(layer.id)}
          onDoubleClick={(event) => {
            event.preventDefault();
            finishRename(false);
            onBeginRename(layer);
          }}
          className={`${buttonClasses} cursor-grab active:cursor-grabbing text-[11px] sm:text-sm`}
          title={isHidden ? `${layer.name} (hidden)` : layer.name}
        >
          {layer.name}
        </button>
      )}
      {showAfter && <span className={dropIndicatorClass} style={{ right: -4 }} />}
    </div>
  );
}
