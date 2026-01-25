import React from "react";
import AssetSettingsPanel from "./AssetSettingsPanel.jsx";
import SelectionLockedNotice from "./SelectionLockedNotice.jsx";
import TokenSettingsPanel from "./TokenSettingsPanel.jsx";

export default function SelectionSettingsPanel(props) {
  const {
    panToolActive,
    zoomToolActive,
    engine,
    interactionMode,
    allowInactiveSelection = false,
    selectedToken,
    selectedTokensList,
    selectedObjsList,
  } = props;

  const selectionControlsVisible = allowInactiveSelection
    ? !panToolActive && !zoomToolActive
    : !panToolActive && !zoomToolActive && (engine === "grid" || interactionMode === "select");

  if (!selectionControlsVisible) {
    return null;
  }

  if (selectedToken) {
    const multipleTokensSelected = (selectedTokensList?.length || 0) > 1;
    if (multipleTokensSelected) {
      return (
        <SelectionLockedNotice>
          Multiple tokens selected — settings locked. Save as a Token Group to manage as a set.
        </SelectionLockedNotice>
      );
    }

    return <TokenSettingsPanel {...props} />;
  }

  return <AssetSettingsPanel {...props} />;
}
