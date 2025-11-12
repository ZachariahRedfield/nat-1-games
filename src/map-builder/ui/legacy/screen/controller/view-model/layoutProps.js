export function createLayoutProps(state) {
  const overlayTop = state.overlayTop ?? state.overlayPosition?.top ?? 0;
  const overlayLeft = state.overlayLeft ?? state.overlayPosition?.left ?? 0;
  const overlayCenter = state.overlayCenter ?? state.overlayPosition?.center ?? 0;

  const fixedBarTop = state.fixedBarTop ?? state.fixedLayerBar?.top ?? 0;
  const fixedBarLeft = state.fixedBarLeft ?? state.fixedLayerBar?.left ?? 0;
  const fixedBarWidth = state.fixedBarWidth ?? state.fixedLayerBar?.width ?? 0;

  return {
    layout: {
      scrollRef: state.scrollRef,
      gridContentRef: state.gridContentRef,
      layerBarWrapRef: state.layerBarWrapRef,
      layerBarHeight: state.layerBarHeight,
      fixedBarTop,
      fixedBarLeft,
      fixedBarWidth,
      overlayTop,
      overlayLeft,
      overlayCenter,
    },
  };
}
