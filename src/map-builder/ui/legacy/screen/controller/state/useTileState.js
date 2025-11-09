import { useState } from "react";

export function useTileState(initialTileSize = 24) {
  const [tileSize, setTileSize] = useState(initialTileSize);
  return { tileSize, setTileSize };
}

export default useTileState;
