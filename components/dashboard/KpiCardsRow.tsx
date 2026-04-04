'use client';

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: 'good' | 'warn' | 'neutral';
}

interface KpiCardsRowProps {
  cards: KpiCard[];
}

function toneStyles(tone: KpiCard['tone']) {
  if (tone === 'good') {
    return 'border-emerald-400/25 bg-emerald-500/5 text-emerald-100';
  }
  if (tone === 'warn') {
    return 'border-amber-400/25 bg-amber-500/5 text-amber-100';
  }
  return 'border-cyan-400/20 bg-cyan-500/5 text-cyan-100';
}

export function KpiCardsRow({ cards }: KpiCardsRowProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`rounded-2xl border px-4 py-3 shadow-[0_24px_60px_-45px_rgba(6,182,212,0.8)] ${toneStyles(card.tone)}`}
        >
          <p className="text-[10px] uppercase tracking-[0.18em]">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
          <p className="mt-1 text-xs text-slate-300/90">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
