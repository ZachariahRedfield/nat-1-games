import { useMemo, useState } from "react";
import FormRenderer from "./FormRenderer";
import type { FormFieldDefinition } from "./fieldTypes";

const fields: FormFieldDefinition[] = [
  {
    id: "tileSize",
    type: "number",
    label: "Tile Size",
    description: "Pixels per tile. Determines base zoom scale.",
    min: 16,
    max: 128,
    step: 4,
  },
  {
    id: "snapToGrid",
    type: "toggle",
    label: "Snap Objects to Grid",
    description: "Force props and tokens to align perfectly with tiles.",
  },
  {
    id: "lighting",
    type: "select",
    label: "Lighting Mode",
    description: "Choose the rendering profile for the encounter.",
    options: [
      { value: "day", label: "Bright Daylight" },
      { value: "dusk", label: "Dusk & Shadows" },
      { value: "night", label: "Night with Fog" },
    ],
  },
  {
    id: "notes",
    type: "text",
    label: "DM Notes",
    description: "Quick reminder visible only to you.",
    placeholder: "Key beats, secrets, or cues…",
  },
];

export default function SettingsPanel() {
  const [values, setValues] = useState<Record<string, unknown>>({
    tileSize: 32,
    snapToGrid: true,
    lighting: "day",
    notes: "",
  });

  const summary = useMemo(() => {
    return `Tiles: ${values.tileSize ?? "?"} • Snap: ${values.snapToGrid ? "on" : "off"} • Lighting: ${values.lighting}`;
  }, [values.lighting, values.snapToGrid, values.tileSize]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h3 className="text-lg font-semibold text-slate-100">Map Settings</h3>
        <p className="text-xs text-slate-400">{summary}</p>
      </header>
      <FormRenderer
        fields={fields}
        values={values}
        onChange={(fieldId, value) =>
          setValues((current) => ({
            ...current,
            [fieldId]: value,
          }))
        }
      />
    </div>
  );
}
