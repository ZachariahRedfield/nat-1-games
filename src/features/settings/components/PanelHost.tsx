import { useEffect, useMemo, useState } from "react";
import type { AppSession } from "../../../app/routes/Root";
import LayersPanel from "./panels/LayersPanel";
import SettingsPanel from "./SettingsPanel";

type PanelDefinition = {
  id: string;
  title: string;
  description?: string;
  render: () => JSX.Element;
};

type PanelHostProps = {
  className?: string;
  session?: AppSession | null;
  panels?: PanelDefinition[];
};

const defaultPanels: PanelDefinition[] = [
  {
    id: "layers",
    title: "Layers",
    description: "Manage visibility and ordering of map strata.",
    render: () => <LayersPanel />,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Global map configuration and behaviors.",
    render: () => <SettingsPanel />,
  },
];

export default function PanelHost({ className = "", session, panels }: PanelHostProps) {
  const availablePanels = useMemo(() => panels ?? defaultPanels, [panels]);
  const [activePanelId, setActivePanelId] = useState<string | null>(
    availablePanels.length > 0 ? availablePanels[0].id : null
  );

  useEffect(() => {
    if (!availablePanels.some((panel) => panel.id === activePanelId)) {
      setActivePanelId(availablePanels[0]?.id ?? null);
    }
  }, [availablePanels, activePanelId]);

  const activePanel = useMemo(
    () => availablePanels.find((panel) => panel.id === activePanelId) ?? null,
    [availablePanels, activePanelId]
  );

  return (
    <aside className={`flex h-full min-w-0 flex-col ${className}`}>
      <header className="border-b border-slate-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Control Panels</p>
        <h2 className="text-base font-semibold text-slate-100">Encounter Setup</h2>
        {session?.username && (
          <p className="text-xs text-slate-400">DM: {session.username}</p>
        )}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <nav className="flex w-32 shrink-0 flex-col gap-1 border-r border-slate-800 bg-slate-950/70 p-2">
          {availablePanels.map((panel) => {
            const isActive = panel.id === activePanelId;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                className={`rounded px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-slate-200 text-slate-900 shadow"
                    : "text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                <div className="font-semibold">{panel.title}</div>
                {panel.description && (
                  <div className="text-[10px] leading-tight text-slate-400">{panel.description}</div>
                )}
              </button>
            );
          })}
        </nav>
        <section className="flex flex-1 flex-col overflow-y-auto bg-slate-900/60 p-4">
          {activePanel ? (
            activePanel.render()
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              No panel selected.
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
