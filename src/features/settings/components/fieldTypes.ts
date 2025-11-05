export type FieldBase = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type TextFieldDefinition = FieldBase & {
  type: "text";
  placeholder?: string;
};

export type NumberFieldDefinition = FieldBase & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

export type ToggleFieldDefinition = FieldBase & {
  type: "toggle";
};

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectFieldDefinition = FieldBase & {
  type: "select";
  options: SelectOption[];
};

export type FormFieldDefinition =
  | TextFieldDefinition
  | NumberFieldDefinition
  | ToggleFieldDefinition
  | SelectFieldDefinition;
