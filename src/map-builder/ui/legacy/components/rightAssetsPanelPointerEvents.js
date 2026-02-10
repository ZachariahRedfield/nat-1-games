export function getRightAssetsPanelPointerEventClasses({ collapsed }) {
  return {
    overlayClassName: "fixed inset-0 z-[10014] pointer-events-none",
    panelClassName: collapsed ? "pointer-events-none" : "pointer-events-auto",
  };
}

export default getRightAssetsPanelPointerEventClasses;
