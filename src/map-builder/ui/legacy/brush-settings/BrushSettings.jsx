import React from "react";
import CanvasBrushSettings from "./CanvasBrushSettings.jsx";
import GridBrushSettings from "./GridBrushSettings.jsx";
import NaturalBrushSettings from "./natural/NaturalBrushSettings.jsx";

export default function BrushSettings(props) {
  const { kind = "grid" } = props;

  if (kind === "canvas") {
    return <CanvasBrushSettings {...props} />;
  }

  if (kind === "natural") {
    return <NaturalBrushSettings {...props} />;
  }

  return <GridBrushSettings {...props} />;
}
