import { handleGridBrushMove } from "./pointer-move/gridBrushMove.js";
import { handleCanvasStroke } from "./pointer-move/canvasStroke.js";
import { handleObjectResize, handleTokenResize } from "./pointer-move/resizeHandlers.js";
import { handleObjectRotation, handleTokenRotation } from "./pointer-move/rotationHandlers.js";
import { handleSelectionMovement } from "./pointer-move/selectionMovement.js";
import { handlePan, handleZoomDrag } from "./pointer-move/zoomPanHandlers.js";
import { getPointerCssPosition } from "./gridPointerUtils.js";

export function createPointerMoveHandler(context) {
  const { geometry, refs, selection, state, config, actions, data } = context;

  return function handlePointerMove(event) {
    const pointer = getPointerCssPosition(event);
    state.setMousePos({ x: pointer.xCss, y: pointer.yCss });

    if (config.zoomToolActive) {
      if (refs.mouseDownRef.current) handleZoomDrag({ refs, event, state });
      return;
    }

    if (handlePan({ event, state, refs })) return;

    if (!refs.mouseDownRef.current) return;
    if (!config.layerIsVisible) return;

    if (handleObjectResize({ event, refs, selection, config, geometry, actions })) return;
    if (handleTokenResize({ event, refs, selection, config, geometry, actions })) return;
    if (handleObjectRotation({ event, refs, selection, config, actions })) return;
    if (handleTokenRotation({ event, refs, selection, config, actions })) return;

    if (config.interactionMode === "select") {
      if (handleSelectionMovement({ event, refs, selection, config, geometry, actions })) return;
      return;
    }

    if (config.engine === "grid") {
      if (handleGridBrushMove({ event, refs, config, geometry, actions })) return;
    }

    if (config.engine === "canvas") {
      handleCanvasStroke({ event, refs, config, data });
    }
  };
}

export default createPointerMoveHandler;
