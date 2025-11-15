import React from "react";

export default function TextCommitInput({
  value, // string | null | undefined
  className = "",
  placeholder = "",
  onCommit, // (val:string) => void
  title,
}) {
  const [text, setText] = React.useState(value ?? "");
  const [focused, setFocused] = React.useState(false);
  const prevValueRef = React.useRef(null);
  const committedRef = React.useRef(false);
  const dirtyRef = React.useRef(false);

  // Sync external value when not focused
  React.useEffect(() => {
    if (focused) return;
    setText(value ?? "");
  }, [value, focused]);

  const commit = (raw) => {
    const s = (raw ?? text) ?? "";
    onCommit?.(s);
    setText(String(s));
    committedRef.current = true;
    dirtyRef.current = false;
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
      const prev = prevValueRef.current;
      setText(prev ?? "");
      e.currentTarget.blur();
      committedRef.current = false;
      return;
    }
  };

  return (
    <input
      type="text"
      className={className}
      value={text}
      placeholder={placeholder}
      onFocus={(event) => {
        setFocused(true);
        committedRef.current = false;
        dirtyRef.current = false;
        const initial = value ?? "";
        prevValueRef.current = initial;
        setText(initial);
        event.target.select?.();
      }}
      onBlur={() => {
        setFocused(false);
        if (!committedRef.current) {
          const prev = prevValueRef.current ?? "";
          if (dirtyRef.current) {
            commit(text ?? "");
          } else {
            setText(prev);
          }
        }
      }}
      onChange={(e) => {
        dirtyRef.current = true;
        setText(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      title={title}
    />
  );
}

