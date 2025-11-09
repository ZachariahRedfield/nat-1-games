import React from "react";

export default function SiteHeaderTitleButton({ onNavigateHome }) {
  return (
    <button
      className="text-2xl font-bold hover:text-gray-200"
      onClick={onNavigateHome}
      title="Home"
    >
      Nat-1 Games
    </button>
  );
}
