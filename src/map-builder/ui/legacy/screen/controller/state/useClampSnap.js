import { useCallback } from "react";

export function useClamp() {
  return useCallback((value, min, max) => Math.max(min, Math.min(max, value)), []);
}

export function useSnap() {
  return useCallback((value, step = 4) => Math.round(value / step) * step, []);
}

export function useClampAndSnap() {
  const clamp = useClamp();
  const snap = useSnap();
  return { clamp, snap };
}

export default useClampAndSnap;
