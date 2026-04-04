'use client';

import { Era } from '../../types/history';

interface WorldSnapshotCardsProps {
  era: Era;
}

const cardClassName =
  'rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_22px_70px_-55px_rgba(6,182,212,0.8)]';

export function WorldSnapshotCards({ era }: WorldSnapshotCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Dominant Powers</p>
        <p className="mt-2 text-sm text-slate-100">{era.summary.dominantPowers.join(' • ')}</p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Major Conflicts / Turning Point
        </p>
        <p className="mt-2 text-sm text-slate-100">
          {era.summary.conflicts.join(' • ') || 'No major conflict markers'}
        </p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Cultural / Scientific Shift
        </p>
        <p className="mt-2 text-sm text-slate-100">
          {era.summary.culturalShift ?? 'Historical context pending enrichment'}
        </p>
      </article>

      <article className={cardClassName}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Trade / Exploration Context
        </p>
        <p className="mt-2 text-sm text-slate-100">
          {era.summary.tradeContext ?? 'Trade context pending enrichment'}
        </p>
      </article>
    </section>
  );
}
