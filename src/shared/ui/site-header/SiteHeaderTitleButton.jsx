import React from "react";

export default function SiteHeaderTitleButton({ onNavigateHome, size = "default" }) {
  const sizeClass = size === "compact" ? "text-lg sm:text-2xl" : "text-2xl";
  return (
    <button
      className={`${sizeClass} font-bold hover:text-gray-200`}
      onClick={onNavigateHome}
      title="Home"
    >
      Nat-1 Games
    </button>
  );
}
