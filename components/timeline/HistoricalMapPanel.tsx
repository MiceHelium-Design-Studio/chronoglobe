'use client';

import { HistoricalTimelineEntry } from '../../types/timeline';

interface HistoricalMapPanelProps {
  entry: HistoricalTimelineEntry;
}

const themeStyles: Record<HistoricalTimelineEntry['mapTheme'], string> = {
  antique:
    'from-[#0f1624] via-[#131b2b] to-[#121826] border-cyan-500/20',
  imperial:
    'from-[#0f1a2c] via-[#172338] to-[#121d30] border-sky-500/20',
  industrial:
    'from-[#131722] via-[#1b1f2d] to-[#161d2a] border-amber-500/20',
  modern:
    'from-[#0d1424] via-[#111a2f] to-[#0c1626] border-blue-500/20',
};

function hotspotTone(intensity: 'high' | 'medium' | 'low') {
  if (intensity === 'high') {
    return 'bg-amber-300 shadow-[0_0_24px_2px_rgba(251,191,36,0.55)]';
  }

  if (intensity === 'medium') {
    return 'bg-cyan-300 shadow-[0_0_18px_1px_rgba(34,211,238,0.45)]';
  }

  return 'bg-slate-300 shadow-[0_0_14px_1px_rgba(226,232,240,0.35)]';
}

export function HistoricalMapPanel({ entry }: HistoricalMapPanelProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-[0_38px_95px_-70px_rgba(6,182,212,0.95)]">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Map Layer</p>
            <h3 className="text-sm font-semibold text-slate-100 sm:text-base">
              World State: {entry.mapVariant}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 text-cyan-100">
              Historical Overlay
            </span>
            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-amber-100">
              Simulated Layer
            </span>
          </div>
        </div>
      </div>

      <div
        className={`relative h-[430px] border-y bg-gradient-to-br ${themeStyles[entry.mapTheme]} sm:h-[520px]`}
      >
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_55%_72%,rgba(251,191,36,0.16),transparent_36%)]" />

        <div className="absolute left-[8%] top-[28%] h-[34%] w-[22%] rounded-[50%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[31%] top-[18%] h-[42%] w-[24%] rounded-[45%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[56%] top-[22%] h-[37%] w-[29%] rounded-[45%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[48%] top-[63%] h-[18%] w-[14%] rounded-[50%] border border-white/10 bg-slate-900/35" />

        {entry.hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            aria-label={`${hotspot.label}: ${hotspot.note}`}
          >
            <span className={`block h-3.5 w-3.5 rounded-full ${hotspotTone(hotspot.intensity)}`} />
            <span className="pointer-events-none mt-2 inline-block rounded-md border border-white/15 bg-slate-950/85 px-2 py-1 text-[11px] text-slate-200 opacity-0 transition group-hover:opacity-100">
              {hotspot.label}
            </span>
          </button>
        ))}

        <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entry.hotspots.slice(0, 3).map((hotspot) => (
            <article
              key={hotspot.id}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur"
            >
              <p className="text-xs font-semibold text-slate-100">{hotspot.label}</p>
              <p className="text-[11px] text-slate-400">{hotspot.region}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
