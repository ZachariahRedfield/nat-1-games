import React from "react";

const targetButtonClass = (target, value) =>
  `px-3 py-1 text-sm ${
    target === value ? "bg-blue-600 text-white" : "bg-transparent text-white/90"
  }`;

export default function TargetSelector({ target, setTarget }) {
  return (
    <div className="mb-3">
      <div className="font-bold text-sm mb-1">Target</div>
      <div className="inline-flex bg-gray-800 border border-gray-700 rounded overflow-hidden">
        <button
          className={targetButtonClass(target, "images")}
          onClick={() => setTarget("images")}
        >
          Images
        </button>
        <button
          className={targetButtonClass(target, "tokens")}
          onClick={() => setTarget("tokens")}
        >
          Tokens
        </button>
      </div>
    </div>
  );
}
