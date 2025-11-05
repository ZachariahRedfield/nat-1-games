import TextField from "./fields/TextField";
import NumberField from "./fields/NumberField";
import ToggleField from "./fields/ToggleField";
import SelectField from "./fields/SelectField";
import type {
  FormFieldDefinition,
  NumberFieldDefinition,
  SelectFieldDefinition,
  TextFieldDefinition,
  ToggleFieldDefinition,
} from "./fieldTypes";

type FormRendererProps = {
  fields: FormFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
};

type FieldComponentProps<T extends FormFieldDefinition> = {
  definition: T;
  value: unknown;
  onChange: (value: unknown) => void;
};

type ComponentMap = {
  text: (props: FieldComponentProps<TextFieldDefinition>) => JSX.Element;
  number: (props: FieldComponentProps<NumberFieldDefinition>) => JSX.Element;
  toggle: (props: FieldComponentProps<ToggleFieldDefinition>) => JSX.Element;
  select: (props: FieldComponentProps<SelectFieldDefinition>) => JSX.Element;
};

const componentMap: ComponentMap = {
  text: ({ definition, value, onChange }) => (
    <TextField definition={definition} value={value} onChange={onChange} />
  ),
  number: ({ definition, value, onChange }) => (
    <NumberField definition={definition} value={value} onChange={onChange} />
  ),
  toggle: ({ definition, value, onChange }) => (
    <ToggleField definition={definition} value={value} onChange={onChange} />
  ),
  select: ({ definition, value, onChange }) => (
    <SelectField definition={definition} value={value} onChange={onChange} />
  ),
};

export default function FormRenderer({ fields, values, onChange }: FormRendererProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const render = componentMap[field.type];
        if (!render) return null;
        const fieldValue = values[field.id];
        return (
          <div key={field.id} className="rounded border border-slate-800 bg-slate-900/70 p-3">
            <label className="block text-sm font-medium text-slate-200">{field.label}</label>
            {field.description && (
              <p className="mt-1 text-xs text-slate-400">{field.description}</p>
            )}
            <div className="mt-3">{render({ definition: field as never, value: fieldValue, onChange: (value) => onChange(field.id, value) })}</div>
          </div>
        );
      })}
    </div>
  );
}
