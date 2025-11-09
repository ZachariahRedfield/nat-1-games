import React from "react";
import { LinkIcon, LinkBrokenIcon } from "./LinkIcons.jsx";

export default function LinkToggleButton({
  linkXY,
  onToggle,
  className,
  linkedTitle = "Linked: change one to set both",
  unlinkedTitle = "Unlinked: set X and Y independently",
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={linkXY ? linkedTitle : unlinkedTitle}
      className={className}
      aria-pressed={linkXY}
    >
      {linkXY ? <LinkIcon /> : <LinkBrokenIcon />}
    </button>
  );
}
