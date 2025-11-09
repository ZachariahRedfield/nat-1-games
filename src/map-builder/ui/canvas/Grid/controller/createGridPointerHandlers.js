import { createPointerDownHandler } from "./pointer-handlers/createPointerDownHandler.js";
import { createPointerMoveHandler } from "./pointer-handlers/createPointerMoveHandler.js";
import { createPointerUpHandler } from "./pointer-handlers/createPointerUpHandler.js";

export function createGridPointerHandlers(dependencies) {
  const context = { ...dependencies };

  return {
    handlePointerDown: createPointerDownHandler(context),
    handlePointerMove: createPointerMoveHandler(context),
    handlePointerUp: createPointerUpHandler(context),
  };
}

export default createGridPointerHandlers;
