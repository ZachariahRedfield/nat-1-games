import { useSceneDimensionsState } from "./scene/useSceneDimensionsState.js";
import { useSceneMapState } from "./scene/useSceneMapState.js";
import { useSceneObjectState } from "./scene/useSceneObjectState.js";
import { useSceneGridResizer } from "./scene/useSceneGridResizer.js";

export function useLegacySceneState({
  getCurrentLayer,
  getIsErasing,
  getCanvasColor,
  initialRows = 30,
  initialCols = 30,
} = {}) {
  const dimensions = useSceneDimensionsState({ initialRows, initialCols });
  const mapState = useSceneMapState({
    rows: dimensions.rows,
    cols: dimensions.cols,
    getCurrentLayer,
    getIsErasing,
    getCanvasColor,
  });
  const objectState = useSceneObjectState();
  const updateGridSizes = useSceneGridResizer({
    rows: dimensions.rows,
    cols: dimensions.cols,
    setMaps: mapState.setMaps,
    setObjects: objectState.setObjects,
  });

  return {
    ...dimensions,
    ...mapState,
    ...objectState,
    updateGridSizes,
  };
}
