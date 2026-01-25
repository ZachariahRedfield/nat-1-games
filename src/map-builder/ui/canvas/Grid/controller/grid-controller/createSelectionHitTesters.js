import {
  hitObjectResizeHandle,
  hitObjectRotateRing,
  hitTokenResizeHandle,
  hitTokenRotateRing,
} from "../selectionHitTests.js";

export const createSelectionHitTesters = ({ getSelectedObject, getSelectedToken, tileSize }) => ({
  hitResizeHandle: (xCss, yCss) => hitObjectResizeHandle(xCss, yCss, { getSelectedObject, tileSize }),
  hitRotateRing: (xCss, yCss) => hitObjectRotateRing(xCss, yCss, { getSelectedObject, tileSize }),
  hitTokenResizeHandle: (xCss, yCss) => hitTokenResizeHandle(xCss, yCss, { getSelectedToken, tileSize }),
  hitTokenRotateRing: (xCss, yCss) => hitTokenRotateRing(xCss, yCss, { getSelectedToken, tileSize }),
});
