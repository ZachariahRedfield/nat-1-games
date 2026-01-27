import React from "react";
import { NumericInput, TextCommitInput } from "../../../../../../../shared/index.js";

const baseInputClass =
  "mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60";

function NameField({ label = "Name", value, onChange }) {
  return (
    <label className="text-xs text-gray-200">
      {label}
      <input
        className={baseInputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FileField({ label, accept, onChange }) {
  return (
    <label className="text-xs text-gray-200">
      {label}
      <input
        type="file"
        accept={accept}
        className="mt-1 w-full text-xs text-gray-100 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-blue-500"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}

export default function AssetCreatorForm({ state }) {
  const { tab } = state;

  if (tab === "image") {
    return (
      <div className="grid gap-3">
        <NameField value={state.name} onChange={state.setName} />
        <FileField label="Upload Image" accept="image/*" onChange={state.setImageFile} />
      </div>
    );
  }

  if (tab === "token") {
    return (
      <div className="grid gap-3">
        <NameField value={state.name} onChange={state.setName} />
        <label className="text-xs text-gray-200">
          Glow Color
          <input
            type="color"
            value={state.tokenGlow}
            onChange={(event) => state.setTokenGlow(event.target.value)}
            className="mt-1 w-full h-9 p-0 border border-gray-500 rounded"
          />
        </label>
        <FileField label="Upload Image" accept="image/*" onChange={state.setTokenFile} />
        <div className="text-[11px] text-gray-400">
          Tip: If left empty, will try selected image asset.
        </div>
      </div>
    );
  }

  if (tab === "text") {
    return (
      <div className="grid gap-3">
        <label className="text-xs text-gray-200">
          Text
          <TextCommitInput
            className={baseInputClass}
            value={state.labelText}
            onCommit={state.setLabelText}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-200">
            Color
            <input
              type="color"
              value={state.labelColor}
              onChange={(event) => state.setLabelColor(event.target.value)}
              className="mt-1 w-full h-9 p-0 border border-gray-500 rounded"
            />
          </label>
          <label className="text-xs text-gray-200">
            Font Size
            <NumericInput
              value={state.labelSize}
              min={8}
              max={128}
              step={1}
              onCommit={(value) => state.setLabelSize(Math.round(value))}
              className={`${baseInputClass} text-center`}
            />
          </label>
          <label className="text-xs text-gray-200 col-span-2">
            Font Family
            <TextCommitInput
              className={baseInputClass}
              value={state.labelFont}
              onCommit={state.setLabelFont}
            />
          </label>
        </div>
      </div>
    );
  }

  if (tab === "material") {
    return (
      <div className="grid gap-3">
        <label className="text-xs text-gray-200">
          Name
          <TextCommitInput
            className={baseInputClass}
            value={state.name}
            onCommit={state.setName}
          />
        </label>
        <label className="text-xs text-gray-200">
          Color
          <input
            type="color"
            value={state.colorHex}
            onChange={(event) => state.setColorHex(event.target.value)}
            className="mt-1 w-full h-9 p-0 border border-gray-500 rounded"
          />
        </label>
      </div>
    );
  }

  if (tab === "natural") {
    return (
      <div className="grid gap-3">
        <label className="text-xs text-gray-200">
          Name
          <TextCommitInput
            className={baseInputClass}
            value={state.name}
            onCommit={state.setName}
          />
        </label>
        <div className="text-xs flex items-center gap-2 text-gray-200">
          <button
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
            onClick={() => state.naturalFileRef.current?.click()}
            type="button"
          >
            Add Image
          </button>
          <input
            ref={state.naturalFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => state.addNaturalFiles(event.target.files)}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {state.variants.map((variant, index) => (
            <div key={index} className="relative border border-gray-700 bg-gray-800 rounded">
              <img src={variant.src} alt={`v-${index}`} className="w-full h-16 object-contain p-1" />
              <button
                className="absolute top-1 right-1 text-[10px] px-1 bg-red-600 hover:bg-red-500 rounded"
                onClick={() => state.removeVariantAt(index)}
                type="button"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
