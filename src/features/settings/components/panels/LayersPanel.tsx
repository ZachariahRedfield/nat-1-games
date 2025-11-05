const placeholderLayers = [
  { id: "background", label: "Background", description: "Base color, textures, or fog." },
  { id: "objects", label: "Objects", description: "Props and environmental details." },
  { id: "tokens", label: "Tokens", description: "Creatures, NPCs, and interactables." },
];

export default function LayersPanel() {
  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-lg font-semibold text-slate-100">Layers</h3>
        <p className="text-xs text-slate-400">Stacked views of the encounter map.</p>
      </header>
      <ol className="flex flex-col gap-2">
        {placeholderLayers.map((layer) => (
          <li
            key={layer.id}
            className="rounded border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
          >
            <div className="font-medium text-slate-100">{layer.label}</div>
            <div className="text-xs text-slate-400">{layer.description}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
