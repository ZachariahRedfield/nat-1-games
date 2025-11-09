import { useCallback, useState } from "react";

export function useMenuState() {
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);
  const toggleMapsMenu = useCallback(() => {
    setMapsMenuOpen((value) => !value);
  }, []);

  return { mapsMenuOpen, toggleMapsMenu, setMapsMenuOpen };
}

export default useMenuState;
