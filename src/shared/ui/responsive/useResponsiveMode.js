import { useEffect, useState } from "react";
import { getResponsiveMode, getViewportSize } from "./breakpoints.js";

export function useResponsiveMode() {
  const [mode, setMode] = useState(() => getResponsiveMode(getViewportSize()));

  useEffect(() => {
    const handleResize = () => {
      setMode(getResponsiveMode(getViewportSize()));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return mode;
}

export default useResponsiveMode;
