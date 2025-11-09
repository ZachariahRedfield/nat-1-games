import { useLegacyMapBuilderState } from "./controller/useLegacyMapBuilderState.js";
import { createLegacyMapBuilderViewModel } from "./controller/createLegacyMapBuilderViewModel.js";

export function useLegacyMapBuilderController() {
  const state = useLegacyMapBuilderState();
  return createLegacyMapBuilderViewModel(state);
}

export default useLegacyMapBuilderController;
