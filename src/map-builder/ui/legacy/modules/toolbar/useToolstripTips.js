import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT_MS = 1500;

function scheduleHide({ timers, setVisibleTips, key, timeout }) {
  const hide = () => {
    setVisibleTips((tips) => ({ ...tips, [key]: false }));
  };
  const timerId = setTimeout(hide, timeout ?? DEFAULT_TIMEOUT_MS);
  timers.current[key] = timerId;
}

export function useToolstripTips({ timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const timers = useRef({});
  const [visibleTips, setVisibleTips] = useState({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
      timers.current = {};
    };
  }, []);

  const showTip = useCallback(
    (key) => {
      if (!key) return;
      const existingTimer = timers.current[key];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      setVisibleTips((tips) => ({ ...tips, [key]: true }));
      scheduleHide({ timers, setVisibleTips, key, timeout });
    },
    [timeout]
  );

  const iconClassFor = useCallback(
    (key) => `${visibleTips[key] ? "opacity-0" : "opacity-100"} transition-opacity`,
    [visibleTips]
  );

  const labelClassFor = useCallback(
    (key) => `${visibleTips[key] ? "opacity-100" : "opacity-0"} transition-opacity`,
    [visibleTips]
  );

  return { showTip, iconClassFor, labelClassFor };
}

export default useToolstripTips;
