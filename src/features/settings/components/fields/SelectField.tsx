import type { SelectFieldDefinition } from "../fieldTypes";

type SelectFieldProps = {
  definition: SelectFieldDefinition;
  value: unknown;
  onChange: (value: string) => void;
};

export default function SelectField({ definition, value, onChange }: SelectFieldProps) {
  const stringValue = typeof value === "string" ? value : definition.options[0]?.value ?? "";
  return (
    <select
      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
      disabled={definition.disabled}
      value={stringValue}
      onChange={(event) => onChange(event.target.value)}
    >
      {definition.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
