import { useStore } from "../../../core/store";
import type { MapStoreApi } from "../services/layers";

interface LayerListProps {
  store: MapStoreApi;
}

export function LayerList({ store }: LayerListProps) {
  const layers = useStore(store, (state) => state.layers);
  const activeLayerId = useStore(store, (state) => state.activeLayerId);
  const setActiveLayer = useStore(store, (state) => state.setActiveLayer);
  const toggleLayerSelection = useStore(store, (state) => state.toggleLayerSelection);

  return (
    <div className="flex flex-col gap-2">
      {layers.map((layer) => {
        const isActive = layer.id === activeLayerId;
        const isSelected = Boolean(layer.selected);
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => setActiveLayer(layer.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              toggleLayerSelection(layer.id);
            }}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
              isActive
                ? "border-blue-500/60 bg-blue-500/10 text-blue-100"
                : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600"
            }`}
          >
            <span className="font-medium">{layer.name}</span>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
              {!layer.visible && <span className="text-amber-400">Hidden</span>}
              {isSelected && <span className="text-emerald-400">Selected</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default LayerList;
