import React, { useEffect, useRef, useState } from "react";

export default function AssetViewToggle({ showPreview, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const options = [
    { label: "Images", value: true },
    { label: "Names", value: false },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [isOpen]);

  return (
    <div className="relative flex items-center gap-2" ref={wrapperRef}>
      <span className="text-[11px] opacity-80">View:</span>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-200"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        View
        <span aria-hidden="true">▾</span>
      </button>
      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 w-32 rounded border border-gray-700 bg-gray-900 shadow-lg"
        >
          {options.map((option) => {
            const isActive = showPreview === option.value;
            return (
              <button
                key={option.label}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs ${
                  isActive ? "bg-gray-800 text-white" : "text-gray-200 hover:bg-gray-800"
                }`}
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="w-3 text-center">{isActive ? "✓" : ""}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
