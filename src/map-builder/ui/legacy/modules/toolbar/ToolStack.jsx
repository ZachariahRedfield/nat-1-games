import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ToolButton from "./ToolButton.jsx";

export default function ToolStack({
  items = [],
  showTip,
  iconClassFor,
  labelClassFor,
  menuLabel = "Tools",
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [allowHover, setAllowHover] = useState(false);

  const activeItem = useMemo(() => items.find((item) => item.active) || items[0], [items]);
  const menuItems = useMemo(
    () => items.filter((item) => item.id !== activeItem?.id),
    [activeItem?.id, items]
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setAllowHover(Boolean(media.matches));
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [activeItem?.id]);

  const handleToggle = useCallback(() => {
    if (items.length <= 1) return;
    setOpen((value) => !value);
  }, [items.length]);

  const handleSelect = useCallback(
    (item) => {
      if (!item || item.disabled) return;
      item.onSelect?.();
      setOpen(false);
    },
    []
  );

  if (!activeItem) return null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex flex-col items-center"
      onMouseEnter={allowHover ? () => setOpen(true) : undefined}
      onMouseLeave={allowHover ? () => setOpen(false) : undefined}
    >
      <ToolButton
        id={activeItem.id}
        label={activeItem.label}
        icon={activeItem.icon}
        active
        disabled={activeItem.disabled}
        onClick={handleToggle}
        showTip={showTip}
        iconClassFor={iconClassFor}
        labelClassFor={labelClassFor}
        wrapperClassName="group"
      />
      {open && menuItems.length > 0 ? (
        <div
          className="absolute left-0 top-full mt-1 flex flex-col items-center gap-1 z-[10020]"
          role="menu"
          aria-label={menuLabel}
        >
          {menuItems.map((item) => (
            <ToolButton
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              active={item.active}
              disabled={item.disabled}
              onClick={() => handleSelect(item)}
              showTip={showTip}
              iconClassFor={iconClassFor}
              labelClassFor={labelClassFor}
              wrapperClassName="group"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
