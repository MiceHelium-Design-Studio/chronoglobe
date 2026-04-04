'use client';

interface IntelRegionSummary {
  id: string;
  name: string;
  detail: string;
}

interface IntelSummaryCardsProps {
  topRegions: IntelRegionSummary[];
  activityLevel: 'Low' | 'Moderate' | 'Elevated';
  signalIntensity: 'Calm' | 'Focused' | 'High';
}

function toneClass(value: IntelSummaryCardsProps['activityLevel'] | IntelSummaryCardsProps['signalIntensity']) {
  if (value === 'High' || value === 'Elevated') {
    return 'text-amber-100 border-amber-400/35 bg-amber-500/10';
  }

  if (value === 'Focused' || value === 'Moderate') {
    return 'text-cyan-100 border-cyan-400/35 bg-cyan-500/10';
  }

  return 'text-emerald-100 border-emerald-400/35 bg-emerald-500/10';
}

export function IntelSummaryCards({
  topRegions,
  activityLevel,
  signalIntensity,
}: IntelSummaryCardsProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Intel Summary</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">Regional Signal Matrix</h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className={`rounded-xl border px-3 py-2 text-xs ${toneClass(activityLevel)}`}>
          <p className="uppercase tracking-[0.14em]">Activity Level</p>
          <p className="mt-1 text-base font-semibold">{activityLevel}</p>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-xs ${toneClass(signalIntensity)}`}>
          <p className="uppercase tracking-[0.14em]">Signal Intensity</p>
          <p className="mt-1 text-base font-semibold">{signalIntensity}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Top Regions</p>
        {topRegions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No tracked regions yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {topRegions.map((region) => (
              <li
                key={region.id}
                className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-2"
              >
                <p className="text-sm font-medium text-slate-100">{region.name}</p>
                <p className="text-xs text-slate-400">{region.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
