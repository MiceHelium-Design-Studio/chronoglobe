'use client';

import { IntelligenceMode } from '../../types/intelligence';

interface MapShellProps {
  title: string;
  subtitle?: string;
  mode: IntelligenceMode;
  theme?: string;
  className?: string;
  children: React.ReactNode;
}

const themeClassMap: Record<string, string> = {
  antique: 'from-[#0f1624] via-[#131b2b] to-[#121826] border-cyan-500/20',
  imperial: 'from-[#0f1a2c] via-[#172338] to-[#121d30] border-sky-500/20',
  industrial: 'from-[#131722] via-[#1b1f2d] to-[#161d2a] border-amber-500/20',
  modern: 'from-[#0d1424] via-[#111a2f] to-[#0c1626] border-blue-500/20',
  live: 'from-[#091522] via-[#0e1b2b] to-[#0a1624] border-cyan-500/20',
  compare: 'from-[#151424] via-[#191b2b] to-[#121726] border-violet-500/20',
};

function resolveTheme(theme: string | undefined, mode: IntelligenceMode): string {
  if (theme && themeClassMap[theme]) {
    return themeClassMap[theme];
  }

  if (mode === 'historical') {
    return themeClassMap.imperial;
  }

  if (mode === 'compare') {
    return themeClassMap.compare;
  }

  return themeClassMap.live;
}

export function MapShell({
  title,
  subtitle,
  mode,
  theme,
  className,
  children,
}: MapShellProps) {
  return (
    <section
      className={`${className} overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-[0_38px_95px_-70px_rgba(6,182,212,0.95)]`}
    >
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {mode === 'historical' ? 'Historical Map' : mode === 'live' ? 'Live Map' : 'Compare Map'}
        </p>
        <h3 className="text-sm font-semibold text-slate-100 sm:text-base">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </div>

      <div
        className={`relative h-[430px] border-y bg-gradient-to-br sm:h-[520px] ${resolveTheme(theme, mode)}`}
      >
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_55%_72%,rgba(251,191,36,0.16),transparent_36%)]" />
        <div className="absolute left-[8%] top-[28%] h-[34%] w-[22%] rounded-[50%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[31%] top-[18%] h-[42%] w-[24%] rounded-[45%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[56%] top-[22%] h-[37%] w-[29%] rounded-[45%] border border-white/10 bg-slate-900/35" />
        <div className="absolute left-[48%] top-[63%] h-[18%] w-[14%] rounded-[50%] border border-white/10 bg-slate-900/35" />
        {children}
      </div>
    </section>
  );
}
