import React from "react";

export default function SiteHeaderNavigation({ items, onNavigate }) {
  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-sm whitespace-nowrap overflow-x-auto px-1">
      {items.map(({ key, label, active, disabled, title }) => (
        <button
          key={key}
          className={
            disabled
              ? "text-gray-500 cursor-not-allowed"
              : active
                ? "text-white font-semibold"
                : "text-gray-400 hover:text-gray-200"
          }
          onClick={() => !disabled && onNavigate?.(key)}
          disabled={disabled}
          title={title || label}
        >
          {label}
          {disabled ? <span className="ml-1 text-[10px] opacity-80">DM only</span> : null}
        </button>
      ))}
    </nav>
  );
}
