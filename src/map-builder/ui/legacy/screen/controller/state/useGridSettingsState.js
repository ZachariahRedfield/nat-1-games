import { useState } from "react";

const DEFAULT_GRID_SETTINGS = {
  sizeTiles: 1,
  sizeCols: 1,
  sizeRows: 1,
  linkXY: false,
  rotation: 0,
  flipX: false,
  flipY: false,
  opacity: 1,
  snapToGrid: true,
  snapStep: 1,
  smartAdjacency: true,
};

export function useGridSettingsState(initialSettings = DEFAULT_GRID_SETTINGS) {
  const [gridSettings, setGridSettings] = useState(initialSettings);

  return { gridSettings, setGridSettings };
}

export default useGridSettingsState;
