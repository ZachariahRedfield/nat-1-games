import React from "react";

export default function ZoomToolOverlay({ active, dragState }) {
  if (!active) return null;

  const marquee =
    dragState && dragState.kind === "marquee"
      ? (() => {
          const left = Math.min(dragState.startCss.x, dragState.curCss.x);
          const top = Math.min(dragState.startCss.y, dragState.curCss.y);
          const width = Math.abs(dragState.curCss.x - dragState.startCss.x);
          const height = Math.abs(dragState.curCss.y - dragState.startCss.y);
          return { left, top, width, height };
        })()
      : null;

  return (
    <>
      {marquee && (
        <div
          className="absolute pointer-events-none border border-emerald-400/80 bg-emerald-400/10"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
            zIndex: 10000,
          }}
        />
      )}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[10001] px-3 py-1 rounded bg-emerald-800/80 text-emerald-100 text-[11px] border border-emerald-600">
        Zoom Tool: Drag a rectangle to zoom. Esc to exit.
      </div>
    </>
  );
}
