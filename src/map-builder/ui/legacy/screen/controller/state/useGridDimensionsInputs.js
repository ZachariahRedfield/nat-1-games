import { useCallback } from "react";

export function useGridDimensionsInputs({ setRowsInput, setColsInput }) {
  const handleChangeRows = useCallback(
    (event) => {
      setRowsInput(event.target.value);
    },
    [setRowsInput]
  );

  const handleChangeCols = useCallback(
    (event) => {
      setColsInput(event.target.value);
    },
    [setColsInput]
  );

  return { handleChangeRows, handleChangeCols };
}

export default useGridDimensionsInputs;
