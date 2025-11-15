import React from "react";
import ToolButton from "../ToolButton.jsx";
import { SmallSaveIcon, SmallTrashIcon } from "../smallIcons.jsx";
import {
  SMALL_TOOL_BUTTON_CLASS,
  TOOLSTRIP_FLOATING_PANEL_CLASS,
} from "../constants.js";

export default function SelectModeToolGroup({
  canActOnSelection,
  onSaveSelection,
  onDeleteSelection,
  showTip,
  iconClassFor,
  labelClassFor,
}) {
  return (
    <div className="absolute left-full ml-2 top-[40px] pointer-events-auto flex items-center gap-2">
      <ToolButton
        id="save"
        label="Save"
        icon={SmallSaveIcon}
        active={false}
        disabled={!canActOnSelection}
        onClick={() => {
          if (!canActOnSelection) return;
          onSaveSelection?.();
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName={TOOLSTRIP_FLOATING_PANEL_CLASS}
        className={SMALL_TOOL_BUTTON_CLASS}
      />

      <ToolButton
        id="delete"
        label="Delete"
        icon={SmallTrashIcon}
        active={false}
        disabled={!canActOnSelection}
        onClick={() => {
          if (!canActOnSelection) return;
          onDeleteSelection?.();
        }}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName={TOOLSTRIP_FLOATING_PANEL_CLASS}
        className={SMALL_TOOL_BUTTON_CLASS}
      />
    </div>
  );
}
