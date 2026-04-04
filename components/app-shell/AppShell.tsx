'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { auth, getFirebaseInitializationError } from '../../lib/firebase';
import { setError, logout } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { AppNav, AppNavItem } from '../navigation/AppNav';
import { BackHomeControls } from '../navigation/BackHomeControls';

const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/map-intelligence', label: 'Map Intelligence' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/settings', label: 'Settings' },
];

const titleMap: Record<string, string> = {
  '/dashboard': 'Command Dashboard',
  '/timeline': 'Historical Timeline',
  '/map-intelligence': 'Map Intelligence',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const syncStatus = useAppSelector((state) => state.sync.status);
  const activeAlerts = useAppSelector(
    (state) => state.watchlist.alerts.filter((alert) => alert.enabled).length,
  );

  const pageTitle = Object.entries(titleMap).find(([prefix]) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  })?.[1];

  const handleSignOut = async () => {
    if (!auth) {
      const initializationError = getFirebaseInitializationError();
      dispatch(
        setError(initializationError?.message ?? 'Authentication is unavailable.'),
      );
      return;
    }

    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : 'Unable to sign out.'),
      );
    }
  };

  const statusTone =
    syncStatus === 'error'
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
      : syncStatus === 'saving' || syncStatus === 'loading'
        ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';

  const statusLabel =
    syncStatus === 'error'
      ? 'Sync Degraded'
      : syncStatus === 'saving' || syncStatus === 'loading'
        ? 'Syncing'
        : 'Live Synced';

  return (
    <div className="min-h-screen bg-[#04060c] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BackHomeControls />
            <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-cyan-200">
              ChronoGlobe
            </Link>
            {pageTitle && (
              <span className="hidden text-xs uppercase tracking-[0.16em] text-slate-400 sm:inline">
                {pageTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] md:inline-flex ${statusTone}`}
            >
              {statusLabel}
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
            >
              Alerts {activeAlerts > 0 ? `(${activeAlerts})` : ''}
            </button>
            {user?.email ? (
              <span className="hidden text-xs text-slate-400 lg:inline">
                {user.email}
              </span>
            ) : null}
            <Link
              href="/pricing"
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
            >
              Pricing
            </Link>
            {user ? (
              <button
                onClick={handleSignOut}
                className="rounded-md border border-cyan-400/35 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-cyan-400/35 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1700px] px-4 pb-3 sm:px-6 lg:px-8">
          <AppNav items={PRIMARY_NAV_ITEMS} className="flex gap-1 overflow-x-auto" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
