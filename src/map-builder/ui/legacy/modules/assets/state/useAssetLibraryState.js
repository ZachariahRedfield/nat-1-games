import { useState } from "react";
import {
  DEFAULT_NATURAL_SETTINGS,
  normalizeNaturalSettings,
  normalizeStamp,
} from "../config/assetDefaults.js";

function useAssetLibraryState() {
  const [assets, setAssets] = useState(() => []);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetGroup, setAssetGroup] = useState("image");
  const [showAssetKindMenu, setShowAssetKindMenu] = useState(true);
  const [showAssetPreviews, setShowAssetPreviews] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorKind, setCreatorKind] = useState("image");
  const [editingAsset, setEditingAsset] = useState(null);
  const [addColorMode, setAddColorMode] = useState("palette");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#66ccff");
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#ffffff");
  const [newLabelSize, setNewLabelSize] = useState(28);
  const [newLabelFont, setNewLabelFont] = useState("Arial");
  const [flowHue, setFlowHue] = useState(200);
  const [flowSat, setFlowSat] = useState(70);
  const [flowLight, setFlowLight] = useState(55);
  const [assetStamp, setAssetStamp] = useState(() => normalizeStamp());
  const [naturalSettings, setNaturalSettings] = useState(() =>
    normalizeNaturalSettings(DEFAULT_NATURAL_SETTINGS)
  );
  const [needsAssetsFolder, setNeedsAssetsFolder] = useState(false);
  const [assetsFolderDialogOpen, setAssetsFolderDialogOpen] = useState(false);

  return {
    assets,
    setAssets,
    selectedAssetId,
    setSelectedAssetId,
    assetGroup,
    setAssetGroup,
    showAssetKindMenu,
    setShowAssetKindMenu,
    showAssetPreviews,
    setShowAssetPreviews,
    creatorOpen,
    setCreatorOpen,
    creatorKind,
    setCreatorKind,
    editingAsset,
    setEditingAsset,
    addColorMode,
    setAddColorMode,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    newLabelText,
    setNewLabelText,
    newLabelColor,
    setNewLabelColor,
    newLabelSize,
    setNewLabelSize,
    newLabelFont,
    setNewLabelFont,
    flowHue,
    setFlowHue,
    flowSat,
    setFlowSat,
    flowLight,
    setFlowLight,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
    needsAssetsFolder,
    setNeedsAssetsFolder,
    assetsFolderDialogOpen,
    setAssetsFolderDialogOpen,
  };
}

export { useAssetLibraryState };
