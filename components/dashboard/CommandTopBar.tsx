'use client';

interface CommandTopBarProps {
  systemStatus: 'nominal' | 'attention';
  operatorName: string;
  operatorEmail: string;
  notificationCount: number;
  onOpenNotifications: () => void;
}

const BellIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
    <path d="M9 17a3 3 0 0 0 6 0" />
  </svg>
);

function getInitials(name: string): string {
  const segments = name
    .split(' ')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (segments.length === 0) {
    return 'OP';
  }

  return segments.map((segment) => segment[0]!.toUpperCase()).join('');
}

export function CommandTopBar({
  systemStatus,
  operatorName,
  operatorEmail,
  notificationCount,
  onOpenNotifications,
}: CommandTopBarProps) {
  return (
    <header className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_20px_60px_-40px_rgba(6,182,212,0.8)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-indigo-500/20 text-cyan-100">
            CG
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-100">ChronoGlobe</p>
            <p className="text-xs text-slate-400">Intelligence Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              systemStatus === 'nominal'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-400/30 bg-amber-500/10 text-amber-100'
            }`}
          >
            {systemStatus === 'nominal' ? 'System Nominal' : 'Attention Needed'}
          </span>

          <button
            onClick={onOpenNotifications}
            className="relative rounded-lg border border-white/15 bg-slate-900/70 p-2 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-100"
            aria-label="Open notifications"
          >
            {BellIcon}
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-cyan-400 px-1 text-[10px] font-semibold text-slate-950">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-[11px] font-semibold text-cyan-100">
              {getInitials(operatorName)}
            </span>
            <div className="min-w-0">
              <p className="max-w-[10rem] truncate text-xs font-medium text-slate-100">
                {operatorName}
              </p>
              <p className="max-w-[10rem] truncate text-[11px] text-slate-400">{operatorEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
