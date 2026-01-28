import React, { useRef } from "react";

const toneStyles = {
  success: "text-emerald-300",
  warning: "text-amber-300",
  error: "text-rose-300",
  info: "text-gray-300",
};

function actionClass(canAct) {
  return `block w-full text-left px-3 py-1 text-sm ${
    canAct ? "text-gray-300 hover:text-white" : "text-gray-500 cursor-not-allowed"
  }`;
}

export default function StorageMenuSection({
  providerLabel,
  canImport,
  canExport,
  importTitle,
  exportTitle,
  onImportPack,
  onExportPack,
  statusMessage,
  statusTone,
}) {
  const inputRef = useRef(null);

  const handleImportClick = () => {
    if (!canImport) return;
    inputRef.current?.click();
  };

  const handleImportChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportPack?.(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="border-b border-gray-700">
      <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400">
        {providerLabel}
      </div>
      <button
        type="button"
        className={actionClass(canImport)}
        onClick={handleImportClick}
        disabled={!canImport}
        title={importTitle}
      >
        Import .nat1pack…
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".nat1pack,application/zip"
        className="hidden"
        onChange={handleImportChange}
      />
      <button
        type="button"
        className={actionClass(canExport)}
        onClick={canExport ? onExportPack : undefined}
        disabled={!canExport}
        title={exportTitle}
      >
        Export .nat1pack
      </button>
      {statusMessage ? (
        <div className={`px-3 pb-2 text-[11px] ${toneStyles[statusTone] || toneStyles.info}`}>
          {statusMessage}
        </div>
      ) : (
        <div className="pb-2" />
      )}
    </div>
  );
}
