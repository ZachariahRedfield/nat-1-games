import React from "react";

const TONE_CLASS = Object.freeze({
  primary: "app-btn--primary",
  neutral: "app-btn--neutral",
  ghost: "app-btn--ghost",
});

const SIZE_CLASS = Object.freeze({
  compact: "app-btn--compact",
  default: "",
  large: "app-btn--large",
});

export default function AppButton({
  children,
  tone = "primary",
  size = "default",
  block = false,
  className = "",
  ...buttonProps
}) {
  const toneClass = TONE_CLASS[tone] || TONE_CLASS.primary;
  const sizeClass = SIZE_CLASS[size] || "";
  const blockClass = block ? "w-full" : "";

  return (
    <button
      className={`app-btn ${toneClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
