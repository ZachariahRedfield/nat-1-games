import { describe, it, expect } from "vitest";
import { clamp, hexToRgba, dist, lerp } from "../components/Map/Grid/utils";

describe("grid math helpers", () => {
  it("clamps values between bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("converts hex colors to rgba", () => {
    expect(hexToRgba("#ff00ff", 0.5)).toBe("rgba(255,0,255,0.5)");
    expect(hexToRgba("#00ff00")).toBe("rgba(0,255,0,1)");
    expect(hexToRgba(null, 0.2)).toBe("rgba(0,0,0,0.2)");
  });

  it("computes distances and interpolations", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };
    expect(dist(a, b)).toBe(5);

    const halfway = lerp(a, b, 0.5);
    expect(halfway).toEqual({ x: 1.5, y: 2 });
  });
});
