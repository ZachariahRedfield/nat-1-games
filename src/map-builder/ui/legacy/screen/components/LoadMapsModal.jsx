import React from "react";

export default function LoadMapsModal({
  open,
  mapsList,
  onClose,
  onOpenMap,
  onDeleteMap,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10055] flex items-center justify-center bg-black/60 pointer-events-auto">
      <div className="w-[96%] max-w-2xl max-h-[80vh] overflow-hidden bg-gray-900 border border-gray-700 rounded text-gray-100">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="font-semibold">Load Map</div>
          <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-3 overflow-auto" style={{ maxHeight: "64vh" }}>
          {mapsList.length === 0 ? (
            <div className="text-sm text-gray-300">
              No maps found. Use Save or Save As to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mapsList.map((m, idx) => (
                <div
                  key={idx}
                  className="text-left px-3 py-2 border border-gray-700 rounded bg-gray-800"
                >
                  <div className="font-medium truncate">{m.name || m.folderName}</div>
                  {m.folderName ? (
                    <div className="text-xs text-gray-300 truncate">Folder: {m.folderName}</div>
                  ) : null}
                  {m.providerLabel || m.providerKey ? (
                    <div className="text-[10px] text-gray-400">
                      Storage: {m.providerLabel || m.providerKey}
                    </div>
                  ) : null}
                  {m.updatedAt || m.mtime ? (
                    <div className="text-[10px] text-gray-400">
                      Updated: {new Date(m.updatedAt || m.mtime).toLocaleString()}
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
                      onClick={() => onOpenMap(m)}
                    >
                      Open
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 rounded"
                      onClick={() => onDeleteMap(m)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
