import type { ToggleFieldDefinition } from "../fieldTypes";

type ToggleFieldProps = {
  definition: ToggleFieldDefinition;
  value: unknown;
  onChange: (value: boolean) => void;
};

export default function ToggleField({ definition, value, onChange }: ToggleFieldProps) {
  const checked = typeof value === "boolean" ? value : false;
  return (
    <button
      type="button"
      disabled={definition.disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors ${
        checked
          ? "border-emerald-500 bg-emerald-600/20 text-emerald-200 hover:border-emerald-400"
          : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-600"
      } ${definition.disabled ? "opacity-50" : ""}`}
    >
      <span>{checked ? "Enabled" : "Disabled"}</span>
      <span
        className={`flex h-5 w-9 items-center rounded-full border transition ${
          checked ? "border-emerald-500 bg-emerald-600/40" : "border-slate-600 bg-slate-800"
        }`}
      >
        <span
          className={`h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
