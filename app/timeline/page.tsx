'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { HistoricalMapPanel } from '../../components/timeline/HistoricalMapPanel';
import { HistoricalSummaryPanel } from '../../components/timeline/HistoricalSummaryPanel';
import { TimelineYearRail } from '../../components/timeline/TimelineYearRail';
import { WorldSnapshotCards } from '../../components/timeline/WorldSnapshotCards';
import { DEFAULT_TIMELINE_YEAR_ID, HISTORICAL_TIMELINE } from '../../lib/timelineData';
import { HistoricalTimelineEntry } from '../../types/timeline';

type TimelineMode = 'political' | 'cultural' | 'conflict' | 'trade';

const modes: Array<{ id: TimelineMode; label: string }> = [
  { id: 'political', label: 'Political' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'conflict', label: 'Conflict' },
  { id: 'trade', label: 'Trade' },
];

export default function TimelinePage() {
  const [selectedYearId, setSelectedYearId] = useState(DEFAULT_TIMELINE_YEAR_ID);
  const [selectedMode, setSelectedMode] = useState<TimelineMode>('political');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const selectedEntry = useMemo<HistoricalTimelineEntry>(() => {
    return (
      HISTORICAL_TIMELINE.find((entry) => entry.id === selectedYearId) ??
      HISTORICAL_TIMELINE[HISTORICAL_TIMELINE.length - 1]
    );
  }, [selectedYearId]);

  return (
    <main className="min-h-screen bg-[#04060c] text-slate-100">
      <AppHeader />

      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(900px 500px at 5% -10%, rgba(30,64,175,0.26), transparent 58%), radial-gradient(980px 560px at 97% 2%, rgba(251,191,36,0.11), transparent 58%), linear-gradient(180deg, rgba(2,6,23,0.48), rgba(2,6,23,0.94))',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1650px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_40px_100px_-70px_rgba(59,130,246,0.95)]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/85">
            Historical Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Historical Timeline
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-300 sm:text-base">
            Traverse pivotal years through a cinematic historical atlas. Select a year to
            update strategic context, map overlays, and world-state summaries.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Region Filter
              </span>
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full rounded-md border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">All Regions</option>
                {selectedEntry.notableRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Timeline Mode
              </span>
              <select
                value={selectedMode}
                onChange={(event) => setSelectedMode(event.target.value as TimelineMode)}
                className="w-full rounded-md border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
              >
                {modes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Compare Mode
              </span>
              <button
                type="button"
                disabled
                className="w-full rounded-md border border-dashed border-white/20 bg-slate-900/55 px-3 py-2 text-left text-sm text-slate-400"
              >
                Compare two eras (coming soon)
              </button>
            </label>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Playback
              </span>
              <button
                type="button"
                disabled
                className="w-full rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100/80"
              >
                Play Timeline
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <HistoricalSummaryPanel entry={selectedEntry} />
            <HistoricalMapPanel entry={selectedEntry} />
            <WorldSnapshotCards entry={selectedEntry} />
          </div>

          <div className="xl:sticky xl:top-24 xl:h-fit">
            <TimelineYearRail
              entries={HISTORICAL_TIMELINE}
              selectedId={selectedYearId}
              onSelect={setSelectedYearId}
            />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Data Integration Placeholder
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Historical snapshots are currently powered by curated mock data for UI and state
            validation. This panel is reserved for future integrations with verified
            historical datasets, archival APIs, and geospatial layers.
          </p>
        </section>
      </div>
    </main>
  );
}
