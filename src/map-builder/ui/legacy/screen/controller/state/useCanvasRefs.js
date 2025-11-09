import { useMemo, useRef } from "react";

export function useCanvasRefs() {
  const backgroundCanvasRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const skyCanvasRef = useRef(null);

  const canvasRefs = useMemo(
    () => ({
      background: backgroundCanvasRef,
      base: baseCanvasRef,
      sky: skyCanvasRef,
    }),
    [backgroundCanvasRef, baseCanvasRef, skyCanvasRef]
  );

  return {
    backgroundCanvasRef,
    baseCanvasRef,
    skyCanvasRef,
    canvasRefs,
  };
}

export default useCanvasRefs;
