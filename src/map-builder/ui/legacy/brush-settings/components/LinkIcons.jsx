import React from "react";

export function LinkIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9.5 11.5h-3a3 3 0 0 1 0-6h3" strokeLinecap="round" />
    </svg>
  );
}

export function LinkBrokenIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M6.5 4.5h3a3 3 0 0 1 0 6h-3" strokeLinecap="round" />
      <path d="M9 6L10.5 4.5M7 6L5.5 4.5M9 10l1.5 1.5M7 10L5.5 11.5" strokeLinecap="round" />
    </svg>
  );
}
