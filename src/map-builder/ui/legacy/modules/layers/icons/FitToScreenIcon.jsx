export function FitToScreenIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 6V3.5H6" />
      <path d="M13 6V3.5H10.5" />
      <path d="M3.5 10V12.5H6" />
      <path d="M13 10V12.5H10.5" />
      <path d="M3.5 3.5l2.5 2.5" />
      <path d="M13 3.5l-2.5 2.5" />
      <path d="M3.5 12.5l2.5-2.5" />
      <path d="M13 12.5l-2.5-2.5" />
    </svg>
  );
}
