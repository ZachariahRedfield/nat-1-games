import React from "react";
import RandomRangeControl from "./RandomRangeControl.jsx";

const DEFAULT_RANDOM_SIZE = { enabled: false, min: 1, max: 1 };
const DEFAULT_RANDOM_OPACITY = { enabled: false, min: 1, max: 1 };

function clampSize(value) {
  return Math.max(1, Math.min(20, Math.round(value)));
}

function clampOpacity(value) {
  const numericValue = parseFloat(value);
  return Math.max(0.05, Math.min(1, numericValue));
}

export default function NaturalRandomRangeSection({
  naturalSettings,
  updateRandomSetting,
  snapshotSettings,
}) {
  const updateRandomSize = (updater) => {
    snapshotSettings?.();
    updateRandomSetting("randomSize", DEFAULT_RANDOM_SIZE, updater);
  };

  const updateRandomOpacity = (updater) => {
    snapshotSettings?.();
    updateRandomSetting("randomOpacity", DEFAULT_RANDOM_OPACITY, updater);
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <RandomRangeControl
        label="Random Size"
        value={naturalSettings?.randomSize}
        defaultValue={DEFAULT_RANDOM_SIZE}
        min={1}
        max={20}
        step={1}
        inputClassName="w-12 p-1 text-black rounded"
        onToggle={(checked) =>
          updateRandomSize((current) => ({ ...current, enabled: checked }))
        }
        onMinCommit={(value) =>
          updateRandomSize((current) => ({ ...current, min: clampSize(value) }))
        }
        onMaxCommit={(value) =>
          updateRandomSize((current) => ({ ...current, max: clampSize(value) }))
        }
      />

      <RandomRangeControl
        label="Random Opacity"
        value={naturalSettings?.randomOpacity}
        defaultValue={DEFAULT_RANDOM_OPACITY}
        min={0.05}
        max={1}
        step={0.05}
        inputClassName="w-14 p-1 text-black rounded"
        onToggle={(checked) =>
          updateRandomOpacity((current) => ({ ...current, enabled: checked }))
        }
        onMinCommit={(value) =>
          updateRandomOpacity((current) => ({ ...current, min: clampOpacity(value) }))
        }
        onMaxCommit={(value) =>
          updateRandomOpacity((current) => ({ ...current, max: clampOpacity(value) }))
        }
      />
    </div>
  );
}
