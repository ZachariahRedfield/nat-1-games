import React from "react";

export default function RotationWheel({ value = 0, onChange, size = 72, className = "" }) {
  const ref = React.useRef(null);
  const draggingRef = React.useRef(false);

  const setFromEvent = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
    const dx = clientX - cx;
    const dy = cy - clientY; // invert Y so top is +90
    let ang = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180 (0 at +X axis)
    ang = Math.round((ang + 360) % 360); // 0..359
    // Convert so 0 is to the right, increasing counter-clockwise is fine
    if (typeof onChange === "function") onChange(ang);
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    setFromEvent(e);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    setFromEvent(e);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  const sz = Math.max(32, size);
  const r = (sz - 8) / 2; // padding for stroke/knob
  const theta = (value % 360) * (Math.PI / 180);
  const hx = Math.cos(theta) * r;
  const hy = -Math.sin(theta) * r; // invert Y for screen coords

  return (
    <div
      ref={ref}
      className={`relative rounded-full border border-gray-600 bg-gray-800/60 ${className}`}
      style={{ width: sz, height: sz, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      title={`${value}\u00B0`}
    >
      {/* tick marks */}
      {[0, 90, 180, 270].map((a) => (
        <div
          key={`tick-${a}`}
          className="absolute bg-gray-500"
          style={{
            left: sz / 2 - 1,
            top: sz / 2 - 4,
            width: 2,
            height: 8,
            transform: `rotate(${a}deg) translateY(-${r}px)`,
            transformOrigin: "center center",
          }}
        />
      ))}
      {/* knob */}
      <div
        className="absolute bg-white rounded-full shadow"
        style={{
          left: sz / 2 + hx - 4,
          top: sz / 2 + hy - 4,
          width: 8,
          height: 8,
        }}
      />
      {/* center dot */}
      <div
        className="absolute rounded-full bg-gray-500"
        style={{ left: sz / 2 - 2, top: sz / 2 - 2, width: 4, height: 4 }}
      />
    </div>
  );
}
