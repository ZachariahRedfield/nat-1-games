import React from "react";
import { LayerListItem } from "./LayerListItem.jsx";

export function LayerList({
  layers,
  currentLayer,
  setCurrentLayer,
  layerVisibility,
  renamingId,
  setRenamingId,
  draftName,
  setDraftName,
  finishRename,
  draggingId,
  dragTarget,
  dropIndicatorClass,
  handleDragStart,
  handleDragOverItem,
  handleDrop,
  handleDragEnd,
}) {
  const handleBeginRename = React.useCallback(
    (layer) => {
      setRenamingId(layer.id);
      setDraftName(layer.name);
    },
    [setDraftName, setRenamingId],
  );

  return layers.map((layer) => {
    const isActive = layer.id === currentLayer;
    const isHidden = layerVisibility?.[layer.id] === false;
    const isEditing = renamingId === layer.id;
    const showBefore =
      dragTarget?.id === layer.id && dragTarget?.position === "before";
    const showAfter =
      dragTarget?.id === layer.id && dragTarget?.position === "after";

    return (
      <LayerListItem
        key={`layerbar-${layer.id}`}
        layer={layer}
        isActive={isActive}
        isHidden={isHidden}
        isEditing={isEditing}
        dropIndicatorClass={dropIndicatorClass}
        showBefore={showBefore}
        showAfter={showAfter}
        draftName={draftName}
        setDraftName={setDraftName}
        finishRename={finishRename}
        onSelectLayer={setCurrentLayer}
        onBeginRename={handleBeginRename}
        draggingId={draggingId}
        onDragStart={handleDragStart}
        onDragOver={handleDragOverItem}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />
    );
  });
}
