'use client';

import { formatUtcTimestamp } from '../../lib/dateTime';
import { UserDataSyncState } from '../../types/sync';

export type CommandSection =
  | 'overview'
  | 'events'
  | 'users'
  | 'sources'
  | 'analytics'
  | 'billing'
  | 'settings';

interface SidebarItem {
  id: CommandSection;
  label: string;
  description: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'overview', label: 'Overview', description: 'Mission summary' },
  { id: 'events', label: 'Events', description: 'Ingestion feed' },
  { id: 'users', label: 'Users', description: 'Operator activity' },
  { id: 'sources', label: 'Sources', description: 'Regional signals' },
  { id: 'analytics', label: 'Analytics', description: 'Performance matrix' },
  { id: 'billing', label: 'Billing', description: 'Plan and access' },
  { id: 'settings', label: 'Global Settings', description: 'Preferences and alerts' },
];

interface CommandSidebarProps {
  activeSection: CommandSection;
  onSelect: (section: CommandSection) => void;
  planName: string;
  sync: UserDataSyncState;
}

function statusAccent(status: UserDataSyncState['status']) {
  switch (status) {
    case 'synced':
      return 'bg-emerald-400';
    case 'saving':
    case 'loading':
      return 'bg-cyan-400';
    case 'error':
      return 'bg-rose-400';
    default:
      return 'bg-slate-500';
  }
}

function statusLabel(status: UserDataSyncState['status']) {
  switch (status) {
    case 'synced':
      return 'Live sync healthy';
    case 'saving':
      return 'Syncing updates';
    case 'loading':
      return 'Bootstrapping cloud state';
    case 'error':
      return 'Sync degraded';
    default:
      return 'Sync standby';
  }
}

export function CommandSidebar({
  activeSection,
  onSelect,
  planName,
  sync,
}: CommandSidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      <nav className="hidden rounded-3xl border border-white/10 bg-slate-950/70 p-3 shadow-[0_30px_70px_-45px_rgba(6,182,212,0.9)] backdrop-blur xl:flex xl:min-h-[calc(100vh-3rem)] xl:sticky xl:top-6 xl:w-[260px]">
        <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/90">
            ChronoGlobe
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">Intelligence Command</p>
          <p className="mt-2 inline-flex rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
            {planName} tier
          </p>
        </div>

        <ul className="space-y-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const active = item.id === activeSection;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    active
                      ? 'border border-cyan-400/40 bg-cyan-400/10'
                      : 'border border-transparent hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-100">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto rounded-2xl border border-white/10 bg-slate-900/70 p-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusAccent(sync.status)}`} />
            <p className="text-xs font-medium text-slate-100">{statusLabel(sync.status)}</p>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {sync.lastSyncedAt
              ? `Last sync ${formatUtcTimestamp(sync.lastSyncedAt)}`
              : 'No sync timestamp yet'}
          </p>
          {sync.error && (
            <p className="mt-1 text-xs text-rose-300">{sync.error}</p>
          )}
        </div>
      </nav>

      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2 xl:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SIDEBAR_ITEMS.map((item) => {
            const active = item.id === activeSection;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active
                    ? 'bg-cyan-400/20 text-cyan-100'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
