import { useRef } from "react";

export function useLayoutRefs() {
  const scrollRef = useRef(null);
  const gridContentRef = useRef(null);
  const topControlsWrapRef = useRef(null);

  return { scrollRef, gridContentRef, topControlsWrapRef };
}

export default useLayoutRefs;
