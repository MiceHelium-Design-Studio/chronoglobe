'use client';

import { IntelligenceMode } from '../../types/intelligence';

interface MapLegendProps {
  mode: IntelligenceMode;
  markerCount: number;
  regionCount: number;
  label?: string;
}

const modeLabelMap: Record<IntelligenceMode, string> = {
  historical: 'Historical Mode',
  live: 'Live Intelligence',
  compare: 'Compare Mode',
};

export function MapLegend({
  mode,
  markerCount,
  regionCount,
  label = 'Legend',
}: MapLegendProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-100">{modeLabelMap[mode]}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">
          {markerCount} markers
        </span>
        <span className="rounded-full border border-slate-400/30 bg-slate-500/10 px-2 py-0.5 text-[11px] text-slate-200">
          {regionCount} regions
        </span>
      </div>
    </div>
  );
}
