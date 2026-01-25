import React from "react";

export default function MixedSelectionWarning() {
  return (
    <div className="mb-3 p-2 bg-amber-900/20 border border-amber-700 rounded text-xs">
      Mixed selection detected (images + tokens). Choose a target below; the other
      type will be ignored for this save.
    </div>
  );
}
