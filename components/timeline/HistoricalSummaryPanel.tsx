'use client';

import { HistoricalTimelineEntry } from '../../types/timeline';

interface HistoricalSummaryPanelProps {
  entry: HistoricalTimelineEntry;
}

export function HistoricalSummaryPanel({ entry }: HistoricalSummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/75 px-5 py-4 shadow-[0_28px_75px_-60px_rgba(59,130,246,0.9)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
          {entry.displayYear}
        </span>
        <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
          {entry.era}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
        {entry.title}
      </h2>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
        {entry.summary}
      </p>
    </section>
  );
}
