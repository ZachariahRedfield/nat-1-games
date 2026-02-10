export function getRightAssetsPanelPointerEventClasses({ collapsed }) {
  return {
    overlayClassName: "fixed z-[10018] pointer-events-none",
    panelClassName: collapsed ? "pointer-events-none" : "pointer-events-auto",
  };
}

export default getRightAssetsPanelPointerEventClasses;
