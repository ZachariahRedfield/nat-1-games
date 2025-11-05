import type { NumberFieldDefinition } from "../fieldTypes";

type NumberFieldProps = {
  definition: NumberFieldDefinition;
  value: unknown;
  onChange: (value: number | null) => void;
};

export default function NumberField({ definition, value, onChange }: NumberFieldProps) {
  const numberValue = typeof value === "number" ? value : "";
  return (
    <input
      type="number"
      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
      disabled={definition.disabled}
      min={definition.min}
      max={definition.max}
      step={definition.step}
      value={numberValue}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "" ? null : Number(next));
      }}
    />
  );
}
