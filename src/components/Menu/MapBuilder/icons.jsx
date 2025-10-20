import React from "react";

export const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M1 8c2.5-4 6-6 7-6s4.5 2 7 6c-2.5 4-6 6-7 6S3.5 12 1 8z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

export const EyeOffIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    aria-hidden="true"
    className={className}
  >
    <path d="M1 8c2.5-4 6-6 7-6s4.5 2 7 6c-2.5 4-6 6-7 6S3.5 12 1 8z" fill="currentColor" opacity=".5" />
    <circle cx="8" cy="8" r="2" fill="currentColor" opacity=".5" />
    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

