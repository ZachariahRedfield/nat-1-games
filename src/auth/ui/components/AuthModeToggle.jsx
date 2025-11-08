import React from "react";

const MODES = [
  { id: "login", label: "Login" },
  { id: "signup", label: "Sign Up" },
];

export function AuthModeToggle({ mode, onChange }) {
  return (
    <div className="flex justify-between items-center">
      <div className="inline-flex rounded overflow-hidden border border-gray-600">
        {MODES.map((option) => {
          const isActive = option.id === mode;
          const base = "px-3 py-1 text-sm transition-colors";
          const variant = isActive
            ? "bg-blue-600 text-white"
            : "bg-transparent text-gray-200 hover:bg-gray-700";
          return (
            <button
              key={option.id}
              type="button"
              className={`${base} ${variant}`}
              onClick={() => onChange?.(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
