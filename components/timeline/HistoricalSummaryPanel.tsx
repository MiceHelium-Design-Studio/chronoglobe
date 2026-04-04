'use client';

import { Era } from '../../types/history';
import { formatHistoricalYear } from '../../lib/timeline/formatHistoricalYear';

interface HistoricalSummaryPanelProps {
  era: Era;
}

export function HistoricalSummaryPanel({ era }: HistoricalSummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/75 px-5 py-4 shadow-[0_28px_75px_-60px_rgba(59,130,246,0.9)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
          {formatHistoricalYear(era.year)}
        </span>
        <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
          {era.eraLabel}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
        {era.title}
      </h2>
      {era.subtitle ? <p className="mt-1 text-sm text-cyan-100/80">{era.subtitle}</p> : null}
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
        {era.description}
      </p>
    </section>
  );
}
