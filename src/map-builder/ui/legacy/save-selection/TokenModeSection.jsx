import React from "react";

export default function TokenModeSection({ selectedTokensCount }) {
  return (
    <div className="space-y-2 text-xs text-gray-300">
      {selectedTokensCount <= 1 ? (
        <>Saving single token as a Token asset. Defaults (grid engine) will be applied.</>
      ) : (
        <>Saving multiple tokens as a Token Group; spawns members side-by-side on placement.</>
      )}
    </div>
  );
}
