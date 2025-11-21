import React from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import NaturalBrushSizeSection from "./components/NaturalBrushSizeSection.jsx";
import NaturalRandomOptionsSection from "./components/NaturalRandomOptionsSection.jsx";
import NaturalRandomRangeSection from "./components/NaturalRandomRangeSection.jsx";

export default function NaturalBrushSettings({
  titleOverride,
  gridSettings,
  setGridSettings,
  naturalSettings,
  setNaturalSettings,
  snapshotSettings,
  hideNaturalSize = false,
}) {
  const updateRandomSetting = (key, defaultValue, updater) => {
    setNaturalSettings((current) => {
      const previous = current?.[key] ?? defaultValue;
      return { ...current, [key]: updater(previous) };
    });
  };

  return (
    <div>
      <SectionTitle title={titleOverride || "Settings"} />
      <div className="grid gap-2">
        {!hideNaturalSize && (
          <NaturalBrushSizeSection
            gridSettings={gridSettings}
            setGridSettings={setGridSettings}
            snapshotSettings={snapshotSettings}
          />
        )}

        <NaturalRandomOptionsSection
          naturalSettings={naturalSettings}
          onChange={setNaturalSettings}
          snapshotSettings={snapshotSettings}
        />

        <NaturalRandomRangeSection
          naturalSettings={naturalSettings}
          updateRandomSetting={updateRandomSetting}
          snapshotSettings={snapshotSettings}
        />
      </div>
    </div>
  );
}
