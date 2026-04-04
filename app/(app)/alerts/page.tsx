'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { UpgradePrompt } from '../../../components/entitlements/UpgradePrompt';
import { useEntitlements } from '../../../hooks/useEntitlements';
import { SupportedCategory } from '../../../types/preferences';
import {
  addAlert,
  removeAlert,
  toggleAlertEnabled,
} from '../../../store/slices/watchlistSlice';
import { useAppDispatch, useAppSelector } from '../../../store/store';

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const followedTopics = useAppSelector((state) => state.preferences.followedTopics);
  const followedRegions = useAppSelector((state) => state.watchlist.followedRegions);
  const alerts = useAppSelector((state) => state.watchlist.alerts);
  const { entitlements } = useEntitlements();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState<SupportedCategory | ''>('');
  const [regionId, setRegionId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!entitlements.alertsEnabled) {
      return;
    }

    if (!topic && !regionId) {
      setFormError('Select a topic or region before creating an alert.');
      return;
    }

    const selectedRegion = followedRegions.find((region) => region.id === regionId);
    const trimmedName = name.trim();

    dispatch(
      addAlert({
        name:
          trimmedName.length > 0
            ? trimmedName
            : `${topic || selectedRegion?.name || 'Watchlist'} alert`,
        topic: topic || null,
        regionId: selectedRegion ? selectedRegion.id : null,
      }),
    );

    setName('');
    setTopic('');
    setRegionId('');
  };

  if (!user) {
    return (
      <main className="py-10 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
            Alerts Command
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in to manage alerts</h1>
          <p className="mt-3 text-slate-300">
            Alert rules and watchlist automation are tied to authenticated user data.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            >
              Login
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
            >
              View plans
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Alerts</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Alert Rules and Watchlists
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Route high-priority topic and region signals into your notification center.
        </p>
      </section>

      {!entitlements.alertsEnabled ? (
        <UpgradePrompt
          title="Alerts are locked on Free"
          description="Upgrade to Pro or Team to create and automate alert rules."
          targetPlan="pro"
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Create Alert
          </p>
          <form className="mt-3 space-y-2" onSubmit={handleCreateAlert}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alert name"
              className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
            />
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value as SupportedCategory | '')}
              className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
            >
              <option value="">Any followed topic</option>
              {followedTopics.map((followedTopic) => (
                <option key={followedTopic} value={followedTopic}>
                  {followedTopic}
                </option>
              ))}
            </select>
            <select
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
            >
              <option value="">Any followed region</option>
              {followedRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!entitlements.alertsEnabled}
              className="w-full rounded-md bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {entitlements.alertsEnabled ? 'Create alert' : 'Upgrade to unlock'}
            </button>
          </form>
          {formError ? <p className="mt-2 text-xs text-rose-300">{formError}</p> : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Active Alerts
          </p>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              No alerts configured yet. Create one using a followed topic or region.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{alert.name}</p>
                      <p className="text-xs text-slate-400">
                        {alert.topic ? `Topic: ${alert.topic}` : 'Any topic'}
                        {' • '}
                        {alert.regionId
                          ? `Region: ${
                              followedRegions.find((region) => region.id === alert.regionId)?.name ??
                              'Unknown'
                            }`
                          : 'Any region'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                        alert.enabled
                          ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                          : 'border border-slate-500/40 bg-slate-500/10 text-slate-300'
                      }`}
                    >
                      {alert.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => dispatch(toggleAlertEnabled(alert.id))}
                      className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-100 hover:bg-white/5"
                    >
                      {alert.enabled ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => dispatch(removeAlert(alert.id))}
                      className="rounded-md border border-rose-400/35 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
