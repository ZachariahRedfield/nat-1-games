import { useEffect } from "react";

export function useGlobalPointerRelease(onPointerRelease) {
  useEffect(() => {
    const handlePointerUp = () => {
      onPointerRelease();
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [onPointerRelease]);
}

export default useGlobalPointerRelease;
