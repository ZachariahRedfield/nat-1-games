import React from "react";

export default function SelectionLockedNotice({ children }) {
  if (!children) {
    return null;
  }

  return (
    <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
      {children}
    </div>
  );
}
