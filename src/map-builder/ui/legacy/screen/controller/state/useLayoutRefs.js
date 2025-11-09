import { useRef } from "react";

export function useLayoutRefs() {
  const scrollRef = useRef(null);
  const gridContentRef = useRef(null);
  const layerBarWrapRef = useRef(null);

  return { scrollRef, gridContentRef, layerBarWrapRef };
}

export default useLayoutRefs;
