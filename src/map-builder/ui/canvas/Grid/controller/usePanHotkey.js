import { useEffect, useState } from "react";

export function usePanHotkey() {
  const [panHotkey, setPanHotkey] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== "Space") return;
      setPanHotkey(true);
      event.preventDefault();
    };

    const onKeyUp = (event) => {
      if (event.code !== "Space") return;
      setPanHotkey(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return panHotkey;
}

export default usePanHotkey;
