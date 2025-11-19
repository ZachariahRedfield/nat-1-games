import {
  eraseGridStampAt as eraseGridStamp,
  placeGridImageAt as placeGridImage,
  placeGridColorStampAt as placeGridColorStamp,
  placeTokenAt as placeToken,
} from "../gridPlacement.js";

export function createPlacementActions(context) {
  const placementContext = { ...context };
  return {
    eraseGridStampAt: (row, col) => eraseGridStamp(row, col, placementContext),
    placeGridImageAt: (row, col) => placeGridImage(row, col, placementContext),
    placeGridColorStampAt: (row, col) => placeGridColorStamp(row, col, placementContext),
    placeTokenAt: (row, col) => placeToken(row, col, placementContext),
  };
}

export default createPlacementActions;
