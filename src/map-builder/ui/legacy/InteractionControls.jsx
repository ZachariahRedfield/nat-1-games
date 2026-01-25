import React from "react";
import DrawContextControls from "./interaction-controls/DrawContextControls.jsx";
import ModeControls from "./interaction-controls/ModeControls.jsx";
import SaveContextControl from "./interaction-controls/SaveContextControl.jsx";

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
      <ModeControls
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        zoomToolActive={zoomToolActive}
        setZoomToolActive={setZoomToolActive}
      />

      <div className="mt-2 flex items-center gap-2">
        {interactionMode === "draw" ? (
          <DrawContextControls
            assetGroup={assetGroup}
            engine={engine}
            setEngine={setEngine}
            isErasing={isErasing}
            setIsErasing={setIsErasing}
          />
        ) : (
          <SaveContextControl canSave={canSave} onSaveClick={onSaveClick} />
        )}
      </div>
    </>
  );
}
