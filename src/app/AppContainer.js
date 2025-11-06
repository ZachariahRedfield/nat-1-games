import * as auth from "../auth/index.js";
import * as mapBuilder from "../map-builder/index.js";
import * as assets from "../assets/index.js";
import * as session from "../session/index.js";
import * as shared from "../shared/index.js";

export function createAppContainer() {
  return {
    auth,
    mapBuilder,
    assets,
    session,
    shared,
  };
}
