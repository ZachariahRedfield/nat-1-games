import React from "react";

export default function RotationWheel({ value = 0, onChange, onStart, size = 72, className = "" }) {
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
    if (typeof onChange === "function") onChange(ang);
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    try { onStart?.(); } catch {}
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

  const sz = Math.max(48, size);
  const r = (sz - 10) / 2; // padding for stroke/knob
  const cx = sz / 2;
  const cy = sz / 2;
  const theta = ((value % 360) + 360) % 360 * (Math.PI / 180);
  const knobX = cx + Math.cos(theta) * r;
  const knobY = cy - Math.sin(theta) * r; // invert Y for screen coords

  // Build a sector path from 0 deg (east) to value deg (counter-clockwise)
  const x0 = cx + r; // angle 0
  const y0 = cy;
  const x1 = knobX;
  const y1 = knobY;
  const largeArc = ((value % 360) + 360) % 360 > 180 ? 1 : 0;
  const sectorPath = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 0 ${x1} ${y1} Z`;

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ width: sz, height: sz, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      title={`${value}\u00B0`}
    >
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}> 
        {/* base circle */}
        <circle cx={cx} cy={cy} r={r} fill="#111827" stroke="#4b5563" strokeWidth="1.5" />
        {/* filled sector (pie) */}
        {value > 0 && (
          <path d={sectorPath} fill="#64748b" opacity="0.35" />
        )}
        {/* ticks at 0/90/180/270 */}
        {[0,90,180,270].map((a) => {
          const rad = a * Math.PI / 180;
          const tx1 = cx + Math.cos(rad) * (r - 6);
          const ty1 = cy - Math.sin(rad) * (r - 6);
          const tx2 = cx + Math.cos(rad) * (r);
          const ty2 = cy - Math.sin(rad) * (r);
          return (
            <line key={`tick-${a}`} x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          );
        })}
        {/* center dot */}
        <circle cx={cx} cy={cy} r={2} fill="#9ca3af" />
        {/* knob at current angle */}
        <circle cx={knobX} cy={knobY} r={5} fill="#ffffff" stroke="#111827" strokeWidth="1" />
      </svg>
    </div>
  );
}
