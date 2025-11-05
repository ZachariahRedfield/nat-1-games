import type { TextFieldDefinition } from "../fieldTypes";

type TextFieldProps = {
  definition: TextFieldDefinition;
  value: unknown;
  onChange: (value: string) => void;
};

export default function TextField({ definition, value, onChange }: TextFieldProps) {
  const textValue = typeof value === "string" ? value : "";
  return (
    <input
      type="text"
      className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
      placeholder={definition.placeholder}
      disabled={definition.disabled}
      value={textValue}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
