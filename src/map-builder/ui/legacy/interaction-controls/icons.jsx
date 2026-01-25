import React from "react";

export const BrushIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 12c2 0 3-.8 3-2l5.2-5.2 2 2L7 12c-.8.8-2 .9-3 .9H2z" />
    <path d="M10 2l4 4 1-1c.6-.6.6-1.4 0-2l-2-2c-.6-.6-1.4-.6-2 0l-1 1z" />
  </svg>
);

export const CursorIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 2l8 6-4 1 1 4-2 1-1-4-4-1z" />
  </svg>
);

export const EraserIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 10l5-5 4 4-5 5H3l-2-2 4-4z" />
    <path d="M7 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const GridIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
  </svg>
);

export const CanvasIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M8 2c1.2 2 4 4 4 7a4 4 0 11-8 0c0-3 2.8-5 4-7z" />
  </svg>
);

export const SaveIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h9l3 3v9H2z" />
    <path d="M4 2h6v4H4zM4 11h8v2H4z" fill="currentColor" />
  </svg>
);

export const ZoomIcon = ({ className = "w-2 h-2" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
