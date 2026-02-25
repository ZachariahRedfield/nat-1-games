import React, { useMemo, useState } from "react";
import { SiteHeader } from "../../../shared/index.js";
import { SCREENS } from "../../../app/screens.js";

const SIMPLE_TIMEZONES = Object.freeze([
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/New_York", label: "Eastern" },
]);

function getInitialTimezone() {
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!deviceTimezone) return SIMPLE_TIMEZONES[0].value;

  const exactMatch = SIMPLE_TIMEZONES.find((zone) => zone.value === deviceTimezone);
  if (exactMatch) return exactMatch.value;

  if (deviceTimezone.startsWith("America/")) {
    if (deviceTimezone.includes("Los_Angeles") || deviceTimezone.includes("Vancouver")) {
      return "America/Los_Angeles";
    }
    if (deviceTimezone.includes("Denver") || deviceTimezone.includes("Phoenix")) {
      return "America/Denver";
    }
    if (deviceTimezone.includes("Chicago") || deviceTimezone.includes("Winnipeg")) {
      return "America/Chicago";
    }
    return "America/New_York";
  }

  return "America/New_York";
}

export default function StartSession({ goBack, session, onLogout, onNavigate, currentScreen }) {
  const [timezone, setTimezone] = useState(getInitialTimezone);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeCycleDays, setActiveCycleDays] = useState(4);
  const [restDays, setRestDays] = useState(3);

  const cycleSummary = useMemo(() => {
    const safeActive = Number.isFinite(activeCycleDays) ? Math.max(1, activeCycleDays) : 1;
    const safeRest = Number.isFinite(restDays) ? Math.max(0, restDays) : 0;
    return {
      totalDays: safeActive + safeRest,
      safeActive,
      safeRest,
    };
  }, [activeCycleDays, restDays]);

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={session}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentScreen={currentScreen || SCREENS.START_SESSION}
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <section className="mx-auto w-full max-w-xl rounded-xl border border-gray-700 bg-gray-800/70 p-4 sm:p-6">
          <h1 className="mb-1 text-xl font-semibold">Create routine</h1>
          <p className="mb-5 text-sm text-gray-300">
            We simplify scheduling with common US time zones and clearly separate training days from
            rest days.
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Time zone</span>
              <select
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {SIMPLE_TIMEZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-400">
                Auto-selected from your device when available.
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Cycle start date</span>
              <input
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <span className="mt-1 block text-xs text-gray-400">
                Day 1 starts on this date, then the cycle repeats.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Training days per cycle</span>
                <input
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2"
                  type="number"
                  min="1"
                  max="14"
                  value={activeCycleDays}
                  onChange={(event) => setActiveCycleDays(Number(event.target.value) || 1)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Rest days per cycle</span>
                <input
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2"
                  type="number"
                  min="0"
                  max="14"
                  value={restDays}
                  onChange={(event) => setRestDays(Number(event.target.value) || 0)}
                />
              </label>
            </div>

            <div className="rounded-md border border-blue-600/40 bg-blue-900/20 px-3 py-2 text-sm text-blue-100">
              Cycle summary: {cycleSummary.safeActive} training day(s) + {cycleSummary.safeRest} rest
              day(s) = {cycleSummary.totalDays} total day(s).
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
