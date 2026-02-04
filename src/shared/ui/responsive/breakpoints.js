export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

export const DEFAULT_VIEWPORT = {
  width: 1024,
  height: 768,
};

export function getViewportSize() {
  if (typeof window === "undefined") {
    return DEFAULT_VIEWPORT;
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getResponsiveMode(viewport = DEFAULT_VIEWPORT) {
  const width = Number(viewport?.width) || DEFAULT_VIEWPORT.width;
  const height = Number(viewport?.height) || DEFAULT_VIEWPORT.height;
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop: width >= BREAKPOINTS.tablet,
    isCompact: width < BREAKPOINTS.tablet,
  };
}
