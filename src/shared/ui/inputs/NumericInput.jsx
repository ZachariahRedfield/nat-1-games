import React from "react";

export default function NumericInput({
  value, // number | null | undefined
  min = undefined,
  max = undefined,
  step = 1,
  className = "",
  placeholder = "",
  onCommit, // (num:number) => void
  title,
}) {
  const [text, setText] = React.useState(
    value === null || value === undefined || Number.isNaN(value) ? "" : String(value)
  );
  const [focused, setFocused] = React.useState(false);
  const prevValueRef = React.useRef(null);
  const committedRef = React.useRef(false);

  // Sync external value when not focused
  React.useEffect(() => {
    if (focused) return;
    const next = value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
    setText(next);
  }, [value, focused]);

  const clamp = (n) => {
    let x = n;
    if (typeof min === "number") x = Math.max(min, x);
    if (typeof max === "number") x = Math.min(max, x);
    return x;
  };

  const commit = (raw) => {
    let s = raw ?? text;
    let n = parseFloat(s);
    if (!Number.isFinite(n)) {
      // If invalid/empty, snap to nearest limit or 0
      if (typeof min === "number" && typeof max === "number") {
        // pick closer bound to previous value, default to min
        n = clamp(typeof value === "number" ? value : min);
      } else if (typeof min === "number") {
        n = min;
      } else if (typeof max === "number") {
        n = Math.min(max, 0);
      } else {
        n = 0;
      }
    }
    n = clamp(n);
    onCommit?.(n);
    setText(String(n));
    committedRef.current = true;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      // revert to value prior to focus
      const prev = prevValueRef.current;
      setText(prev === null || prev === undefined ? "" : String(prev));
      e.currentTarget.blur();
      committedRef.current = false;
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const base = Number.isFinite(parseFloat(text)) ? parseFloat(text) : (typeof value === "number" ? value : (typeof min === "number" ? min : 0));
      const mult = e.shiftKey ? 10 : 1;
      const delta = step * mult * (e.key === "ArrowUp" ? 1 : -1);
      const next = clamp(base + delta);
      setText(String(next));
      onCommit?.(next);
      committedRef.current = true;
      return;
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      placeholder={placeholder}
      onFocus={() => {
        setFocused(true);
        committedRef.current = false;
        prevValueRef.current = value;
        setText("");
      }}
      onBlur={() => {
        setFocused(false);
        // if no explicit commit, restore previous value
        if (!committedRef.current) {
          const prev = prevValueRef.current;
          setText(prev === null || prev === undefined || Number.isNaN(prev) ? "" : String(prev));
        }
      }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      title={title}
    />
  );
}
