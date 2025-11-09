import React from "react";

const DEFAULT_ACTIVE_CLASS = "bg-gray-700 text-white";
const DEFAULT_INACTIVE_CLASS = "bg-transparent text-white/90 hover:bg-gray-700/40";
const DEFAULT_DISABLED_CLASS = "bg-transparent text-white/50 cursor-not-allowed";

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
        disabled={disabled}
        onClick={handleClick}
        className={`relative w-8 h-8 flex items-center justify-center rounded ${baseClass} ${className}`}
      >
        <span className={iconClassFor?.(id)}>{Icon ? <Icon /> : null}</span>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${labelClassFor?.(id)}`}>
          {label}
        </span>
      </button>
    </div>
  );
}
