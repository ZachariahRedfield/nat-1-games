import { createRef, useMemo, useRef } from "react";

export function useCanvasRefs(layers = []) {
  const refsMapRef = useRef(new Map());

  const canvasRefs = useMemo(() => {
    const next = {};
    const ids = layers.map((layer) => layer.id);
    for (const key of Array.from(refsMapRef.current.keys())) {
      if (!ids.includes(key)) {
        refsMapRef.current.delete(key);
      }
    }
    for (const id of ids) {
      if (!refsMapRef.current.has(id)) {
        refsMapRef.current.set(id, createRef());
      }
      next[id] = refsMapRef.current.get(id);
    }
    return next;
  }, [layers]);

  return {
    canvasRefs,
  };
}

export default useCanvasRefs;
