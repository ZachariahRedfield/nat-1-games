import React from "react";
import ToolButton from "../ToolButton.jsx";
import {
  SmallCanvasIcon,
  SmallEraserIcon,
  SmallGridIcon,
} from "../smallIcons.jsx";
import {
  SMALL_TOOL_BUTTON_CLASS,
  TOOLSTRIP_FLOATING_PANEL_CLASS,
} from "../constants.js";

export default function DrawModeToolGroup({
  engine,
  assetGroup,
  isErasing,
  setEngine,
  setIsErasing,
  showTip,
  iconClassFor,
  labelClassFor,
}) {
  return (
    <div className="absolute left-full ml-2 top-1 pointer-events-auto flex items-center gap-2">
      <ToolButton
        id="grid"
        label="Grid"
        icon={SmallGridIcon}
        active={engine === "grid"}
        onClick={() => {
          setEngine?.("grid");
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName={TOOLSTRIP_FLOATING_PANEL_CLASS}
        className={SMALL_TOOL_BUTTON_CLASS}
      />

      <ToolButton
        id="canvas"
        label="Canvas"
        icon={SmallCanvasIcon}
        active={engine === "canvas"}
        onClick={() => {
          if (assetGroup === "token") return;
          setEngine?.("canvas");
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName={TOOLSTRIP_FLOATING_PANEL_CLASS}
        className={SMALL_TOOL_BUTTON_CLASS}
        inactiveClassName={
          assetGroup === "token"
            ? "text-white/40 cursor-not-allowed"
            : undefined
        }
      />

      <ToolButton
        id="eraser"
        label="Eraser"
        icon={SmallEraserIcon}
        active={isErasing}
        onClick={() => {
          setIsErasing?.((state) => !state);
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName={TOOLSTRIP_FLOATING_PANEL_CLASS}
        activeClassName="bg-red-700 text-white"
        className={SMALL_TOOL_BUTTON_CLASS}
      />
    </div>
  );
}
