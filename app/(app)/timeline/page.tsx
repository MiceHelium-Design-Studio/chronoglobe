'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HistoricalMapPanel } from '../../../components/timeline/HistoricalMapPanel';
import { HistoricalSummaryPanel } from '../../../components/timeline/HistoricalSummaryPanel';
import { TimelineYearRail } from '../../../components/timeline/TimelineYearRail';
import { WorldSnapshotCards } from '../../../components/timeline/WorldSnapshotCards';
import { getTimelineEras } from '../../../services/history/getTimelineEras';

type TimelineMode = 'political' | 'cultural' | 'conflict' | 'trade';

const modes: Array<{ id: TimelineMode; label: string }> = [
  { id: 'political', label: 'Political' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'conflict', label: 'Conflict' },
  { id: 'trade', label: 'Trade' },
];

const timelineEras = getTimelineEras();
const timelineEraYears = new Set(timelineEras.map((era) => era.year));
const defaultYear = timelineEras[timelineEras.length - 1]?.year ?? 2025;

function parseYearParam(rawYear: string | null): number | null {
  if (!rawYear) {
    return null;
  }

  const parsed = Number.parseInt(rawYear, 10);
  if (!Number.isFinite(parsed) || !timelineEraYears.has(parsed)) {
    return null;
  }

  return parsed;
}

export default function TimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMode, setSelectedMode] = useState<TimelineMode>('political');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const selectedYear = useMemo(() => {
    return parseYearParam(searchParams.get('year')) ?? defaultYear;
  }, [searchParams]);

  const selectedEra = useMemo(() => {
    return timelineEras.find((era) => era.year === selectedYear) ?? timelineEras[timelineEras.length - 1];
  }, [selectedYear]);

  const handleYearSelect = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', String(year));
    router.replace(`/timeline?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="relative text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(900px 500px at 5% -10%, rgba(30,64,175,0.26), transparent 58%), radial-gradient(980px 560px at 97% 2%, rgba(251,191,36,0.11), transparent 58%), linear-gradient(180deg, rgba(2,6,23,0.48), rgba(2,6,23,0.94))',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1650px] pb-8 pt-1">
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_40px_100px_-70px_rgba(59,130,246,0.95)]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/85">
            Historical Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Historical Timeline
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-300 sm:text-base">
            Traverse pivotal years through a cinematic historical atlas. Selected year
            drives map overlays, event timelines, and world-state context.
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
                {selectedEra.map.regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.label}
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
                Then vs now overlay (coming soon)
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
            <HistoricalSummaryPanel era={selectedEra} />
            <HistoricalMapPanel era={selectedEra} />
            <WorldSnapshotCards era={selectedEra} />
          </div>

          <div className="xl:sticky xl:top-24 xl:h-fit">
            <TimelineYearRail
              eras={timelineEras}
              selectedYear={selectedYear}
              onSelectYear={handleYearSelect}
            />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Data Integration Status
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Timeline is currently backed by structured seed era/event records. This
            surface is already wired for schema-validated ingestion and can be migrated to
            Firestore/CMS-backed historical datasets without redesigning the UI state flow.
          </p>
        </section>
      </div>
    </main>
  );
}
