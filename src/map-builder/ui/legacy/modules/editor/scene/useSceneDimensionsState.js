import { useMemo, useState } from "react";
import { clampDimension } from "./sceneMath.js";

export function useSceneDimensionsState({ initialRows = 30, initialCols = 30 } = {}) {
  const [rowsInput, setRowsInput] = useState(String(initialRows));
  const [colsInput, setColsInput] = useState(String(initialCols));

  const rows = useMemo(
    () => clampDimension(rowsInput, initialRows),
    [rowsInput, initialRows]
  );
  const cols = useMemo(
    () => clampDimension(colsInput, initialCols),
    [colsInput, initialCols]
  );

  return {
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    rows,
    cols,
  };
}

export default useSceneDimensionsState;
