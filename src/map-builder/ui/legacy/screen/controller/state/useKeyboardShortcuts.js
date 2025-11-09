import { useEffect } from "react";

export function useKeyboardShortcuts({ setZoomToolActive }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Escape") {
        setZoomToolActive(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setZoomToolActive]);
}

export default useKeyboardShortcuts;
