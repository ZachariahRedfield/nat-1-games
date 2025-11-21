import React from "react";

const RANDOM_OPTIONS = [
  { key: "randomRotation", label: "Random Rotation" },
  { key: "randomVariant", label: "Random Variant" },
  { key: "randomFlipX", label: "Random Flip X" },
  { key: "randomFlipY", label: "Random Flip Y" },
];

export default function NaturalRandomOptionsSection({
  naturalSettings,
  onChange,
  snapshotSettings,
}) {
  const handleToggle = (key, checked) => {
    snapshotSettings?.();
    onChange((current) => ({ ...current, [key]: checked }));
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {RANDOM_OPTIONS.map(({ key, label }) => (
        <label key={key} className="text-xs inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!naturalSettings?.[key]}
            onChange={(event) => handleToggle(key, event.target.checked)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
