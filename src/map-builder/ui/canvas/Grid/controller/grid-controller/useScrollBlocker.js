import { useEffect } from "react";

function shouldAllowScroll({ panToolActive, panHotkey, isPanning }) {
  return panToolActive || panHotkey || isPanning;
}

function shouldBlockEvent({ eventTarget, scrollEl, contentEl, allowScroll }) {
  if (!scrollEl) return false;
  if (allowScroll) return false;
  const nodeAvailable = typeof Node !== "undefined";
  if (!nodeAvailable) return eventTarget === scrollEl;
  if (!(eventTarget instanceof Node)) return false;
  if (eventTarget === scrollEl) return true;
  if (!contentEl) return false;
  return contentEl.contains(eventTarget);
}

export function useScrollBlocker({ scrollRef, contentRef, panToolActive, panHotkey, isPanning }) {
  useEffect(() => {
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return undefined;

    const contentEl = contentRef?.current;

    const handleWheel = (event) => {
      const allowScroll = shouldAllowScroll({ panToolActive, panHotkey, isPanning });
      if (shouldBlockEvent({ eventTarget: event.target, scrollEl, contentEl, allowScroll })) {
        event.preventDefault();
      }
    };

    const handleTouchMove = (event) => {
      const allowScroll = shouldAllowScroll({ panToolActive, panHotkey, isPanning });
      if (shouldBlockEvent({ eventTarget: event.target, scrollEl, contentEl, allowScroll })) {
        event.preventDefault();
      }
    };

    scrollEl.addEventListener("wheel", handleWheel, { passive: false });
    scrollEl.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      scrollEl.removeEventListener("wheel", handleWheel);
      scrollEl.removeEventListener("touchmove", handleTouchMove);
    };
  }, [scrollRef, contentRef, panToolActive, panHotkey, isPanning]);
}

export default useScrollBlocker;
