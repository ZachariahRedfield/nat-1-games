import { createAssetPanelProps } from "./assetPanelProps.js";

export function createRightAssetsPanelProps(state) {
  return {
    assetPanelProps: createAssetPanelProps(state),
    assetStamp: state.assetStamp,
    setAssetStamp: state.setAssetStamp,
    naturalSettings: state.naturalSettings,
    setNaturalSettings: state.setNaturalSettings,
  };
}
