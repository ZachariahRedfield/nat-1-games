import { LEGACY_MAP_BUILDER_Z_INDEX_CLASSES } from "../layering/zIndexClasses.js";

export function getRightAssetsPanelPointerEventClasses({ collapsed }) {
  return {
    overlayClassName: `fixed inset-0 ${LEGACY_MAP_BUILDER_Z_INDEX_CLASSES.RIGHT_ASSETS_OVERLAY} pointer-events-none`,
    panelClassName: collapsed ? "pointer-events-none" : "pointer-events-auto",
  };
}

export default getRightAssetsPanelPointerEventClasses;
