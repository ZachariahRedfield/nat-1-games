import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULTS = Object.freeze({
  tokenGlow: "#7dd3fc",
  labelText: "Label",
  labelColor: "#ffffff",
  labelFont: "Arial",
  labelSize: 28,
  colorHex: "#66ccff",
});

export function useAssetCreatorState({ kind = "image", initialAsset = null }) {
  const tab = useMemo(() => kind, [kind]);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tokenFile, setTokenFile] = useState(null);
  const [tokenGlow, setTokenGlow] = useState(DEFAULTS.tokenGlow);
  const [labelText, setLabelText] = useState(DEFAULTS.labelText);
  const [labelColor, setLabelColor] = useState(DEFAULTS.labelColor);
  const [labelFont, setLabelFont] = useState(DEFAULTS.labelFont);
  const [labelSize, setLabelSize] = useState(DEFAULTS.labelSize);
  const [colorHex, setColorHex] = useState(DEFAULTS.colorHex);
  const [variants, setVariants] = useState([]);
  const naturalFileRef = useRef(null);

  useEffect(() => {
    if (!initialAsset) return;

    setName(initialAsset.name || "");

    if (tab === "token") {
      setTokenGlow(initialAsset.glowDefault || DEFAULTS.tokenGlow);
    }

    if (tab === "text") {
      const meta = initialAsset.labelMeta || {};
      setLabelText(meta.text || initialAsset.name || DEFAULTS.labelText);
      setLabelColor(meta.color || DEFAULTS.labelColor);
      setLabelFont(meta.font || DEFAULTS.labelFont);
      setLabelSize(meta.size || DEFAULTS.labelSize);
    }

    if (tab === "material") {
      setColorHex(initialAsset.color || DEFAULTS.colorHex);
    }

    if (tab === "natural") {
      setVariants(Array.isArray(initialAsset.variants) ? initialAsset.variants.slice(0, 16) : []);
    }
  }, [initialAsset, tab]);

  const addNaturalFiles = useCallback((fileList) => {
    const list = Array.from(fileList || []);
    list.forEach((file) => {
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setVariants((prev) => [
          ...prev,
          {
            src,
            aspectRatio: img.width && img.height ? img.width / img.height : 1,
            fileSizeBytes: file.size,
          },
        ]);
      };
      img.src = src;
    });
  }, []);

  const removeVariantAt = useCallback((index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    tab,
    name,
    setName,
    imageFile,
    setImageFile,
    tokenFile,
    setTokenFile,
    tokenGlow,
    setTokenGlow,
    labelText,
    setLabelText,
    labelColor,
    setLabelColor,
    labelFont,
    setLabelFont,
    labelSize,
    setLabelSize,
    colorHex,
    setColorHex,
    variants,
    setVariants,
    naturalFileRef,
    addNaturalFiles,
    removeVariantAt,
  };
}
