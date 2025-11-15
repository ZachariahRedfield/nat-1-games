import React from "react";
import { CanvasIcon, EraserIcon, GridIcon, SaveIcon, TrashIcon } from "./icons.jsx";
import { SMALL_TOOL_ICON_CLASS } from "./constants.js";

function createSmallIcon(IconComponent) {
  const SmallIcon = (props) => {
    const className = `${SMALL_TOOL_ICON_CLASS} ${props?.className ?? ""}`.trim();
    return <IconComponent {...props} className={className} />;
  };

  const iconName = IconComponent?.displayName || IconComponent?.name || "Icon";
  SmallIcon.displayName = `Small${iconName}`;

  return SmallIcon;
}

export const SmallGridIcon = createSmallIcon(GridIcon);
export const SmallCanvasIcon = createSmallIcon(CanvasIcon);
export const SmallEraserIcon = createSmallIcon(EraserIcon);
export const SmallSaveIcon = createSmallIcon(SaveIcon);
export const SmallTrashIcon = createSmallIcon(TrashIcon);

export { createSmallIcon };
