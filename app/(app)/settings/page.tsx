'use client';

import Link from 'next/link';
import { formatUtcTimestamp } from '../../../lib/dateTime';
import { CATEGORY_OPTIONS } from '../../../types/preferences';
import {
  clearRecentSearches,
  setPreferredLanguage,
  toggleFollowedTopic,
} from '../../../store/slices/preferencesSlice';
import { useAppDispatch, useAppSelector } from '../../../store/store';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const sync = useAppSelector((state) => state.sync);
  const billing = useAppSelector((state) => state.auth.billing);
  const preferences = useAppSelector((state) => state.preferences);

  if (!user) {
    return (
      <main className="py-10 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold">Login required</h1>
          <p className="mt-3 text-slate-300">
            Account settings and synced preferences are available after authentication.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Global Settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Preferences and Sync
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Manage language defaults, followed topics, and account-level sync state.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Account</p>
          <p className="mt-2 text-sm text-slate-100">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
            Plan: {billing.plan}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Billing updated {formatUtcTimestamp(billing.updatedAt)}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex rounded-md border border-cyan-400/35 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/15"
          >
            Manage Plan
          </Link>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Sync Health</p>
          <p className="mt-2 text-sm text-slate-100">Status: {sync.status}</p>
          <p className="mt-1 text-xs text-slate-400">
            Last synced {sync.lastSyncedAt ? formatUtcTimestamp(sync.lastSyncedAt) : 'not yet'}
          </p>
          {sync.error ? (
            <p className="mt-2 text-xs text-rose-300">{sync.error}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">No sync errors reported.</p>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Language Preference
          </p>
          <select
            value={preferences.preferredLanguage}
            onChange={(event) => dispatch(setPreferredLanguage(event.target.value))}
            className="mt-2 w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Followed Topics</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((topic) => {
              const selected = preferences.followedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  onClick={() => dispatch(toggleFollowedTopic(topic))}
                  className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-wide ${
                    selected
                      ? 'bg-cyan-500/20 text-cyan-100'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Recent Searches</p>
          <p className="mt-2 text-sm text-slate-300">
            {preferences.recentSearches.length} saved searches
          </p>
          <button
            onClick={() => dispatch(clearRecentSearches())}
            disabled={preferences.recentSearches.length === 0}
            className="mt-3 rounded-md border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Search History
          </button>
        </article>
      </section>
    </main>
  );
}
