import React from "react";

function CreationButton({ children, onClick }) {
  return (
    <button
      type="button"
      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function AssetCreationToolbar({ onOpenCreator }) {
  const open = (kind) => () => onOpenCreator?.(kind);

  return (
    <div className="mt-1 mb-3 flex flex-wrap items-center gap-2">
      <CreationButton onClick={open("image")}>Create Image</CreationButton>
      <CreationButton onClick={open("text")}>Text/Label</CreationButton>
      <CreationButton onClick={open("material")}>Add Color</CreationButton>
      <CreationButton onClick={open("natural")}>Add Natural</CreationButton>
      <CreationButton onClick={open("token")}>Add Token</CreationButton>
    </div>
  );
}
