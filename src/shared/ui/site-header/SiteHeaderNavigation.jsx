import React from "react";

export default function SiteHeaderNavigation({ items, onNavigate }) {
  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-sm whitespace-nowrap overflow-x-auto px-1">
      {items.map(({ key, label, active }) => (
        <button
          key={key}
          className={active ? "text-white font-semibold" : "text-gray-400 hover:text-gray-200"}
          onClick={() => onNavigate?.(key)}
          title={label}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
