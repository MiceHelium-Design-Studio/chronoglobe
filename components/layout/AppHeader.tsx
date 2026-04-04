'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, getFirebaseInitializationError } from '../../lib/firebase';
import { setError, logout } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';

interface AppHeaderProps {
  minimal?: boolean;
}

export function AppHeader({ minimal = false }: AppHeaderProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

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

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-cyan-300">
          ChronoGlobe
        </Link>

        <nav className="flex items-center gap-3 text-sm text-slate-300">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/timeline" className="hover:text-white">
            Timeline
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          {!minimal && (
            <>
              <Link href="/legal/privacy" className="hidden hover:text-white sm:inline">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hidden hover:text-white sm:inline">
                Terms
              </Link>
              <Link
                href="/legal/data-sources"
                className="hidden hover:text-white md:inline"
              >
                Data Sources
              </Link>
            </>
          )}
          {user ? (
            <button
              onClick={handleSignOut}
              className="rounded-md border border-cyan-400/40 px-3 py-1.5 text-cyan-300 hover:bg-cyan-400/10"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-cyan-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-cyan-400"
              >
                Start Free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
