export function cellBackground(value) {
  if (!value) return "transparent";
  if (typeof value === "string") {
    if (value.startsWith("rgba(") || value.startsWith("rgb(")) return value;
    if (value.startsWith("#")) return value;
  }

  switch (value) {
    case "grass":
      return "green";
    case "water":
      return "blue";
    case "stone":
      return "gray";
    default:
      return "transparent";
  }
}

export default cellBackground;
