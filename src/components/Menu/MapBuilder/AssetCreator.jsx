import React from "react";
import NumericInput from "../../common/NumericInput";

export default function AssetCreator({
  kind = 'image',
  onClose,
  onCreate,
  onUpdate,
  initialAsset = null,
  selectedImageSrc,
  mode = 'create', // 'create' | 'edit'
}) {
  const tab = kind; // locked to the button the user clicked
  // shared
  const [name, setName] = React.useState("");

  // image
  const [imageFile, setImageFile] = React.useState(null);

  // token
  const [tokenFile, setTokenFile] = React.useState(null);
  const [tokenGlow, setTokenGlow] = React.useState('#7dd3fc');

  // text/label
  const [labelText, setLabelText] = React.useState('Label');
  const [labelColor, setLabelColor] = React.useState('#ffffff');
  const [labelFont, setLabelFont] = React.useState('Arial');
  const [labelSize, setLabelSize] = React.useState(28);

  // color (material)
  const [colorHex, setColorHex] = React.useState('#66ccff');

  // natural
  const [variants, setVariants] = React.useState([]); // [{src, aspectRatio}]
  const naturalFileRef = React.useRef(null);
  const addNaturalFiles = (files) => {
    const list = Array.from(files || []);
    list.forEach((file) => {
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setVariants((prev) => [ ...prev, { src, aspectRatio: (img.width && img.height) ? img.width / img.height : 1 } ]);
      };
      img.src = src;
    });
  };
  const removeVariantAt = (i) => setVariants((v) => v.filter((_, idx) => idx !== i));

  // Prefill when editing
  React.useEffect(() => {
    if (!initialAsset) return;
    setName(initialAsset.name || "");
    if (tab === 'token') {
      setTokenGlow(initialAsset.glowDefault || '#7dd3fc');
    }
    if (tab === 'text') {
      const lm = initialAsset.labelMeta || {};
      setLabelText(lm.text || initialAsset.name || 'Label');
      setLabelColor(lm.color || '#ffffff');
      setLabelFont(lm.font || 'Arial');
      setLabelSize(lm.size || 28);
    }
    if (tab === 'material') {
      setColorHex(initialAsset.color || '#66ccff');
    }
    if (tab === 'natural') {
      setVariants(Array.isArray(initialAsset.variants) ? initialAsset.variants.slice(0,16) : []);
    }
  }, [initialAsset, tab]);

  const save = async () => {
    const nm = (name || (tab === 'text' ? labelText : tab)).trim() || tab;
    if (tab === 'image') {
      if (!imageFile) return;
      const src = URL.createObjectURL(imageFile);
      const img = new Image();
      img.onload = () => {
        const a = {
          id: undefined,
          name: nm,
          kind: 'image',
          src,
          aspectRatio: img.width && img.height ? img.width / img.height : 1,
          defaultEngine: 'grid',
          allowedEngines: ['grid','canvas'],
          defaults: { sizeTiles: 1, opacity: 1, snap: true },
          img,
        };
        onCreate?.(a, 'image');
      };
      img.src = src;
      return;
    }
    if (tab === 'token') {
      let src = null; let ar = 1;
      if (tokenFile) {
        src = URL.createObjectURL(tokenFile);
        const im = new Image();
        await new Promise((res)=>{ im.onload = res; im.src = src; });
        ar = im.width && im.height ? im.width / im.height : 1;
      } else if (selectedImageSrc) {
        src = selectedImageSrc; ar = 1;
      } else return;
      const a = {
        id: undefined,
        name: nm,
        kind: 'token',
        src,
        aspectRatio: ar,
        defaultEngine: 'grid',
        allowedEngines: [],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
        glowDefault: tokenGlow,
      };
      onCreate?.(a, 'token');
      return;
    }
    if (tab === 'text') {
      const size = Math.max(8, Math.min(128, parseInt(labelSize) || 28));
      const padding = Math.round(size * 0.35);
      const measureCanvas = document.createElement('canvas');
      const mctx = measureCanvas.getContext('2d');
      mctx.font = `${size}px ${labelFont}`;
      const metrics = mctx.measureText(labelText);
      const textW = Math.ceil(metrics.width);
      const textH = Math.ceil(size * 1.2);
      const w = Math.max(1, textW + padding * 2);
      const h = Math.max(1, textH + padding * 2);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,w,h);
      ctx.font = `${size}px ${labelFont}`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = labelColor;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
      ctx.fillText(labelText, padding, padding);
      const src = canvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        const a = {
          id: undefined,
          name: nm,
          kind: 'image',
          src,
          aspectRatio: img.width && img.height ? img.width / img.height : 1,
          defaultEngine: 'grid',
          allowedEngines: ['grid','canvas'],
          defaults: { sizeTiles: 1, opacity: 1, snap: true },
          img,
          labelMeta: { text: labelText, color: labelColor, font: labelFont, size: labelSize },
        };
        onCreate?.(a, 'image');
      };
      img.src = src;
      return;
    }
    if (tab === 'material') {
      const a = {
        id: undefined,
        name: nm || 'Color',
        kind: 'color',
        color: colorHex,
        defaultEngine: 'canvas',
        allowedEngines: ['grid','canvas'],
        defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.6, snap: false },
      };
      onCreate?.(a, 'material');
      return;
    }
    if (tab === 'natural') {
      if (!variants.length) return;
      const a = {
        id: undefined,
        name: nm || 'Natural',
        kind: 'natural',
        variants: variants.slice(0,16),
        defaultEngine: 'grid',
        allowedEngines: [],
        defaults: { sizeTiles: 1, opacity: 1, snap: true },
      };
      onCreate?.(a, 'natural');
      return;
    }
  };

  const saveEdit = async () => {
    if (!initialAsset) return;
    const base = { ...initialAsset, name: (name || initialAsset.name || '').trim() };
    if (tab === 'image') {
      if (imageFile) {
        const src = URL.createObjectURL(imageFile);
        const img = new Image();
        await new Promise((res)=>{ img.onload = res; img.src = src; });
        const updated = {
          ...base,
          kind: 'image',
          src,
          img,
          aspectRatio: img.width && img.height ? img.width / img.height : (initialAsset.aspectRatio || 1),
        };
        onUpdate?.(updated);
      } else {
        // Rename only
        onUpdate?.(base);
      }
      return;
    }
    if (tab === 'token') {
      let src = initialAsset.src;
      let ar = initialAsset.aspectRatio || 1;
      if (tokenFile) {
        src = URL.createObjectURL(tokenFile);
        const im = new Image();
        await new Promise((res)=>{ im.onload = res; im.src = src; });
        ar = im.width && im.height ? im.width / im.height : ar;
      }
      onUpdate?.({ ...base, kind: 'token', src, aspectRatio: ar, glowDefault: tokenGlow });
      return;
    }
    if (tab === 'text') {
      const size = Math.max(8, Math.min(128, parseInt(labelSize) || 28));
      const padding = Math.round(size * 0.35);
      const measureCanvas = document.createElement('canvas');
      const mctx = measureCanvas.getContext('2d');
      mctx.font = `${size}px ${labelFont}`;
      const metrics = mctx.measureText(labelText);
      const textW = Math.ceil(metrics.width);
      const textH = Math.ceil(size * 1.2);
      const w = Math.max(1, textW + padding * 2);
      const h = Math.max(1, textH + padding * 2);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,w,h);
      ctx.font = `${size}px ${labelFont}`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = labelColor;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
      ctx.fillText(labelText, padding, padding);
      const src = canvas.toDataURL('image/png');
      const img = new Image();
      await new Promise((res)=>{ img.onload = res; img.src = src; });
      onUpdate?.({
        ...base,
        kind: 'image',
        src,
        img,
        aspectRatio: img.width && img.height ? img.width / img.height : (initialAsset.aspectRatio || 1),
        labelMeta: { text: labelText, color: labelColor, font: labelFont, size: labelSize },
      });
      return;
    }
    if (tab === 'material') {
      onUpdate?.({ ...base, kind: 'color', color: colorHex });
      return;
    }
    if (tab === 'natural') {
      onUpdate?.({ ...base, kind: 'natural', variants: variants.slice(0,16) });
      return;
    }
  };

  // Render content for the selected creator tab. Note: use a plain
  // render function (not a nested component) to avoid remounting
  // the subtree on every keystroke, which can steal input focus.
  const renderSection = () => {
    if (tab === 'image') return (
      <div className="grid gap-2">
        <label className="text-xs">Name
          <input className="w-full p-1 text-black rounded" value={name} onChange={(e)=>setName(e.target.value)} />
        </label>
        <label className="text-xs">Upload Image
          <input type="file" accept="image/*" className="w-full text-xs" onChange={(e)=> setImageFile(e.target.files?.[0] || null)} />
        </label>
      </div>
    );
    if (tab === 'token') return (
      <div className="grid gap-2">
        <label className="text-xs">Name
          <input className="w-full p-1 text-black rounded" value={name} onChange={(e)=>setName(e.target.value)} />
        </label>
        <label className="text-xs">Glow Color
          <input type="color" value={tokenGlow} onChange={(e)=> setTokenGlow(e.target.value)} className="w-full h-8 p-0 border border-gray-500 rounded" />
        </label>
        <label className="text-xs">Upload Image
          <input type="file" accept="image/*" className="w-full text-xs" onChange={(e)=> setTokenFile(e.target.files?.[0] || null)} />
        </label>
        <div className="text-[10px] text-gray-300">Tip: If left empty, will try selected image asset.</div>
      </div>
    );
    if (tab === 'text') return (
      <div className="grid gap-2">
        <label className="text-xs">Text
          <input className="w-full p-1 text-black rounded" value={labelText} onChange={(e)=>setLabelText(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Color
            <input type="color" value={labelColor} onChange={(e)=> setLabelColor(e.target.value)} className="w-full h-8 p-0 border border-gray-500 rounded" />
          </label>
          <label className="text-xs">Font Size
            <NumericInput
              value={labelSize}
              min={8}
              max={128}
              step={1}
              onCommit={(n)=> setLabelSize(Math.round(n))}
              className="w-full p-1 text-black rounded"
            />
          </label>
          <label className="text-xs col-span-2">Font Family
            <input className="w-full p-1 text-black rounded" value={labelFont} onChange={(e)=> setLabelFont(e.target.value)} />
          </label>
        </div>
      </div>
    );
    if (tab === 'material') return (
      <div className="grid gap-2">
        <label className="text-xs">Name
          <input className="w-full p-1 text-black rounded" value={name} onChange={(e)=>setName(e.target.value)} />
        </label>
        <label className="text-xs">Color
          <input type="color" value={colorHex} onChange={(e)=> setColorHex(e.target.value)} className="w-full h-8 p-0 border border-gray-500 rounded" />
        </label>
      </div>
    );
    if (tab === 'natural') return (
      <div className="grid gap-2">
        <label className="text-xs">Name
          <input className="w-full p-1 text-black rounded" value={name} onChange={(e)=>setName(e.target.value)} />
        </label>
        <div className="text-xs flex items-center gap-2">
          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={()=> naturalFileRef.current?.click()}>Add Image</button>
          <input ref={naturalFileRef} type="file" accept="image/*" className="hidden" onChange={(e)=> addNaturalFiles(e.target.files)} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {variants.map((v,i)=> (
            <div key={i} className="relative border border-gray-600 rounded">
              <img src={v.src} alt={`v-${i}`} className="w-full h-14 object-contain" />
              <button className="absolute top-1 right-1 text-[10px] px-1 bg-red-700 rounded" onClick={()=> removeVariantAt(i)}>X</button>
            </div>
          ))}
        </div>
      </div>
    );
    return null;
  };

  return (
    <div className="mb-3 p-2 border border-gray-600 rounded space-y-3">
      {renderSection()}
      <div className="flex gap-2">
        {mode === 'edit' ? (
          <>
            <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={async ()=> { await saveEdit(); onClose?.(); }}>Save</button>
            <button className="px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-sm" title="Save as a new asset" onClick={async ()=> { await save(); onClose?.(); }}>Save Copy</button>
          </>
        ) : (
          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={async ()=> { await save(); onClose?.(); }}>Save Asset</button>
        )}
        <button className="px-2 py-1 bg-gray-700 rounded text-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
