import React from "react";
import { NumericInput, TextCommitInput } from "../../../../../../../shared/index.js";

function getInputWidthStyle(value, { min = 16, max = 36 } = {}) {
  const length = String(value ?? "").length;
  const width = Math.min(max, Math.max(min, length + 2));
  return { width: `${width}ch`, maxWidth: "100%" };
}

function NameField({ label = "Name", value, onChange }) {
  return (
    <label className="text-xs">
      {label}
      <input
        className="p-1 text-black rounded max-w-full"
        style={getInputWidthStyle(value)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FileField({ label, accept, onChange }) {
  return (
    <label className="text-xs">
      {label}
      <input
        type="file"
        accept={accept}
        className="w-full text-xs"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}

export default function AssetCreatorForm({ state }) {
  const { tab } = state;

  if (tab === "image") {
    return (
      <div className="grid gap-2">
        <NameField value={state.name} onChange={state.setName} />
        <FileField label="Upload Image" accept="image/*" onChange={state.setImageFile} />
      </div>
    );
  }

  if (tab === "token") {
    return (
      <div className="grid gap-2">
        <NameField value={state.name} onChange={state.setName} />
        <label className="text-xs">
          Glow Color
          <input
            type="color"
            value={state.tokenGlow}
            onChange={(event) => state.setTokenGlow(event.target.value)}
            className="w-full h-8 p-0 border border-gray-500 rounded"
          />
        </label>
        <FileField label="Upload Image" accept="image/*" onChange={state.setTokenFile} />
        <div className="text-[10px] text-gray-300">
          Tip: If left empty, will try selected image asset.
        </div>
      </div>
    );
  }

  if (tab === "text") {
    return (
      <div className="grid gap-2">
        <label className="text-xs">
          Text
          <TextCommitInput
            className="p-1 text-black rounded max-w-full"
            style={getInputWidthStyle(state.labelText, { min: 18, max: 48 })}
            value={state.labelText}
            onCommit={state.setLabelText}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            Color
            <input
              type="color"
              value={state.labelColor}
              onChange={(event) => state.setLabelColor(event.target.value)}
              className="w-full h-8 p-0 border border-gray-500 rounded"
            />
          </label>
          <label className="text-xs">
            Font Size
            <NumericInput
              value={state.labelSize}
              min={8}
              max={128}
              step={1}
              onCommit={(value) => state.setLabelSize(Math.round(value))}
              className="w-12 px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
          <label className="text-xs col-span-2">
            Font Family
            <TextCommitInput
              className="p-1 text-black rounded max-w-full"
              style={getInputWidthStyle(state.labelFont, { min: 18, max: 48 })}
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
      <div className="grid gap-2">
        <label className="text-xs">
          Name
          <TextCommitInput
            className="p-1 text-black rounded max-w-full"
            style={getInputWidthStyle(state.name)}
            value={state.name}
            onCommit={state.setName}
          />
        </label>
        <label className="text-xs">
          Color
          <input
            type="color"
            value={state.colorHex}
            onChange={(event) => state.setColorHex(event.target.value)}
            className="w-full h-8 p-0 border border-gray-500 rounded"
          />
        </label>
      </div>
    );
  }

  if (tab === "natural") {
    return (
      <div className="grid gap-2">
        <label className="text-xs">
          Name
          <TextCommitInput
            className="p-1 text-black rounded max-w-full"
            style={getInputWidthStyle(state.name)}
            value={state.name}
            onCommit={state.setName}
          />
        </label>
        <div className="text-xs flex items-center gap-2">
          <button
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
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
            <div key={index} className="relative border border-gray-600 rounded">
              <img src={variant.src} alt={`v-${index}`} className="w-full h-14 object-contain" />
              <button
                className="absolute top-1 right-1 text-[10px] px-1 bg-red-700 rounded"
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
