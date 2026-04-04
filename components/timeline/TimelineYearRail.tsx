'use client';

import { KeyEventsList } from './KeyEventsList';
import { HistoricalTimelineEntry } from '../../types/timeline';

interface TimelineYearRailProps {
  entries: HistoricalTimelineEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TimelineYearRail({
  entries,
  selectedId,
  onSelect,
}: TimelineYearRailProps) {
  const selectedIndex = entries.findIndex((entry) => entry.id === selectedId);
  const selectedEntry = entries[selectedIndex] ?? entries[0];

  return (
    <aside className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 shadow-[0_32px_90px_-68px_rgba(59,130,246,0.95)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Year Rail</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-100">Chronological Selector</h3>

      <div className="mt-4 hidden max-h-[420px] overflow-y-auto pr-2 xl:block">
        <div className="relative pl-7">
          <span className="absolute left-[11px] top-0 h-full w-px bg-gradient-to-b from-cyan-400/70 via-slate-600 to-slate-700" />
          <ul className="space-y-2">
            {entries.map((entry, index) => {
              const distance = Math.abs(index - selectedIndex);
              const active = entry.id === selectedId;
              const fadeClass =
                distance === 0
                  ? 'opacity-100'
                  : distance === 1
                    ? 'opacity-80'
                    : distance === 2
                      ? 'opacity-60'
                      : 'opacity-40';

              return (
                <li key={entry.id} className={fadeClass}>
                  <button
                    onClick={() => onSelect(entry.id)}
                    className={`relative w-full rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? 'border-cyan-400/45 bg-cyan-500/10'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${
                        active ? 'bg-cyan-300' : 'bg-slate-500'
                      }`}
                    />
                    <p
                      className={`text-sm font-semibold ${
                        active ? 'text-cyan-100' : 'text-slate-200'
                      }`}
                    >
                      {entry.displayYear}
                    </p>
                    <p className="text-[11px] text-slate-400">{entry.era}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-4 xl:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {entries.map((entry) => {
            const active = entry.id === selectedId;
            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 bg-slate-900/50 text-slate-300'
                }`}
              >
                {entry.displayYear}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Selected Year
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">{selectedEntry.displayYear}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-amber-100/90">
          {selectedEntry.era}
        </p>
        <p className="mt-2 text-sm text-slate-300">{selectedEntry.summary}</p>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Notable Regions</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedEntry.notableRegions.map((region) => (
            <span
              key={region}
              className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
            >
              {region}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <KeyEventsList events={selectedEntry.keyEvents} />
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
      >
        View Full Historical Brief
      </button>
    </aside>
  );
}
