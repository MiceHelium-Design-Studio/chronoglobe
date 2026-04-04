'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AppHeader } from '../../components/layout/AppHeader';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { auth, getFirebaseInitializationError } from '../../lib/firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { reportAuthError } from '../../lib/errorTracking';

export default function Login() {
  const router = useRouter();
  const { track } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!auth) {
      const initializationError = getFirebaseInitializationError();
      setError(
        initializationError?.message ?? 'Authentication is unavailable right now.',
      );
      setSubmitting(false);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      track('login', { method: 'email', uid: credential.user.uid });
      router.push('/dashboard');
    } catch (submitError) {
      reportAuthError(submitError, { operation: 'login', route: '/login' });
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to log in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader minimal />
      <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to continue tracking global events.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Email"
              className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2"
            />

            {error && (
              <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleSignInButton />

          <p className="mt-4 text-sm text-slate-300">
            New here?{' '}
            <Link href="/signup" className="text-cyan-300 hover:text-cyan-200">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
