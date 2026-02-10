import React from "react";

const DEFAULT_ACTIVE_CLASS =
  "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 border border-white/10";
const DEFAULT_INACTIVE_CLASS =
  "text-white bg-slate-800/80 hover:bg-slate-700/80 hover:text-white shadow-md shadow-black/30 border border-white/10";
const DEFAULT_DISABLED_CLASS =
  "text-white/70 bg-slate-800/40 border border-white/5 cursor-not-allowed";

export default function ToolButton({
  id,
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
  showTip,
  iconClassFor,
  labelClassFor,
  wrapperClassName = "group relative",
  className = "",
  activeClassName = DEFAULT_ACTIVE_CLASS,
  inactiveClassName = DEFAULT_INACTIVE_CLASS,
  disabledClassName = DEFAULT_DISABLED_CLASS,
}) {
  const resolvedActiveClass = activeClassName || DEFAULT_ACTIVE_CLASS;
  const resolvedInactiveClass = inactiveClassName || DEFAULT_INACTIVE_CLASS;
  const resolvedDisabledClass = disabledClassName || DEFAULT_DISABLED_CLASS;

  const baseClass = disabled
    ? resolvedDisabledClass
    : active
    ? resolvedActiveClass
    : resolvedInactiveClass;

  const handleClick = (event) => {
    showTip?.(id);
    onClick?.(event);
  };

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        aria-label={label}
        data-testid={`tool-${id}`}
        data-active={active ? "true" : "false"}
        disabled={disabled}
        onClick={handleClick}
        className={`relative w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${baseClass} ${className}`}
      >
        <span className={iconClassFor?.(id)}>{Icon ? <Icon /> : null}</span>
        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold tracking-wide uppercase ${labelClassFor?.(id)}`}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
