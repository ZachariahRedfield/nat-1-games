import { useEffect, useState } from "react";

export function usePanHotkey() {
  const [panHotkey, setPanHotkey] = useState(false);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target) return false;
      const tag = target.tagName ? target.tagName.toLowerCase() : "";
      return target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
    };

    const onKeyDown = (event) => {
      if (event.code !== "Space") return;
      if (isEditableTarget(event.target)) return;
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
