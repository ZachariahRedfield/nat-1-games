export const segmentedButtonClass = (isActive) =>
  `px-1 py-px text-[8px] font-medium relative group inline-flex items-center justify-center gap-0.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
    isActive
      ? "bg-blue-500/90 text-white shadow-inner"
      : "bg-slate-900 text-white/90 hover:text-white hover:bg-slate-800"
  }`;

export const toggleButtonClass = (isActive) =>
  `px-1.5 py-px text-[8px] font-medium relative group inline-flex items-center gap-0.5 rounded-lg border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
    isActive
      ? "border-red-500/80 bg-red-600/80 text-white shadow-inner"
      : "border-slate-200/50 bg-slate-900/80 text-white/90 hover:text-white hover:bg-slate-900/95"
  }`;

export const primaryButtonClass = (enabled) =>
  `px-1.5 py-px text-[8px] font-medium relative group inline-flex items-center gap-0.5 rounded-lg border transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
    enabled
      ? "border-amber-300/80 bg-amber-400/80 text-slate-900 hover:bg-amber-300/80"
      : "cursor-not-allowed border-slate-200/30 bg-slate-900/30 text-white/60"
  }`;

export const tooltipClass =
  "absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 pointer-events-none";
