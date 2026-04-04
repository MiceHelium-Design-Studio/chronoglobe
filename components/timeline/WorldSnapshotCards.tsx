'use client';

import { HistoricalTimelineEntry } from '../../types/timeline';

interface WorldSnapshotCardsProps {
  entry: HistoricalTimelineEntry;
}

const cardClassName =
  'rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_22px_70px_-55px_rgba(6,182,212,0.8)]';

export function WorldSnapshotCards({ entry }: WorldSnapshotCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Dominant Powers</p>
        <p className="mt-2 text-sm text-slate-100">{entry.dominantPowers.join(' • ')}</p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Turning Point</p>
        <p className="mt-2 text-sm text-slate-100">{entry.turningPoint}</p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Cultural Shift</p>
        <p className="mt-2 text-sm text-slate-100">{entry.culturalShift}</p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Trade Context</p>
        <p className="mt-2 text-sm text-slate-100">{entry.tradeContext}</p>
      </article>
    </section>
  );
}
