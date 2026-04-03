'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UpgradePrompt } from '../../components/entitlements/UpgradePrompt';
import { AppHeader } from '../../components/layout/AppHeader';
import NewsList from '../../components/news/NewsList';
import FilterPanel from '../../components/filters/FilterPanel';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import { useEntitlements } from '../../hooks/useEntitlements';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useBillingActions } from '../../hooks/useBillingActions';
import { formatUtcTimestamp } from '../../lib/dateTime';
import { CATEGORY_OPTIONS, SupportedCategory } from '../../types/preferences';
import { toggleFollowedTopic } from '../../store/slices/preferencesSlice';
import {
  addAlert,
  followRegionFromLocation,
  removeAlert,
  toggleAlertEnabled,
  unfollowRegion,
} from '../../store/slices/watchlistSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';

const DynamicMap = dynamic(() => import('../../components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-300">
      Loading map...
    </div>
  ),
});

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const billing = useAppSelector((state) => state.auth.billing);
  const bookmarks = useAppSelector((state) => state.bookmarks.bookmarks);
  const savedLocations = useAppSelector((state) => state.map.markers);
  const { recentSearches, followedTopics } = useAppSelector(
    (state) => state.preferences,
  );
  const { followedRegions, alerts } = useAppSelector((state) => state.watchlist);
  const { planDefinition, entitlements, canAddFollowedTopic } = useEntitlements();
  const { track } = useAnalytics();
  const {
    loading: billingLoading,
    error: billingError,
    clearError: clearBillingError,
    openPortal,
    refreshBilling,
  } = useBillingActions();
  const sync = useAppSelector((state) => state.sync);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [topicsGateOpen, setTopicsGateOpen] = useState(false);
  const [alertsGateOpen, setAlertsGateOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertTopic, setAlertTopic] = useState<SupportedCategory | ''>('');
  const [alertRegionId, setAlertRegionId] = useState('');
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (searchParams.get('billing') === 'success') {
      void refreshBilling();
    }
  }, [refreshBilling, searchParams, user]);

  const handleToggleTopic = (topic: (typeof CATEGORY_OPTIONS)[number]) => {
    const isFollowing = followedTopics.includes(topic);

    if (isFollowing) {
      dispatch(toggleFollowedTopic(topic));
      return;
    }

    if (!canAddFollowedTopic(followedTopics.length)) {
      setTopicsGateOpen(true);
      track('upgrade_cta_click', {
        plan: 'pro',
        location: 'topics_gate',
      });
      return;
    }

    dispatch(toggleFollowedTopic(topic));
  };

  const isLocationAlreadyFollowed = (locationId: string) =>
    followedRegions.some((region) => region.sourceLocationId === locationId);

  const handleFollowRegion = (locationId: string) => {
    const location = savedLocations.find((item) => item.id === locationId);

    if (!location) {
      return;
    }

    dispatch(
      followRegionFromLocation({
        id: location.id,
        title: location.title,
        lat: location.lat,
        lng: location.lng,
      }),
    );
  };

  const handleCreateAlert = () => {
    if (!entitlements.alertsEnabled) {
      setAlertsGateOpen(true);
      track('upgrade_cta_click', {
        plan: 'pro',
        location: 'alerts_gate',
      });
      return;
    }

    if (!alertTopic && !alertRegionId) {
      setAlertError('Select a topic or followed region for the alert.');
      return;
    }

    const trimmedName = alertName.trim();
    const selectedRegion = followedRegions.find((region) => region.id === alertRegionId);

    dispatch(
      addAlert({
        name:
          trimmedName.length > 0
            ? trimmedName
            : `${alertTopic || selectedRegion?.name || 'Watchlist'} alert`,
        topic: alertTopic || null,
        regionId: selectedRegion ? selectedRegion.id : null,
      }),
    );

    setAlertName('');
    setAlertTopic('');
    setAlertRegionId('');
    setAlertError(null);
    setAlertsGateOpen(false);
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <AppHeader />
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <h1 className="text-3xl font-semibold">Sign in to access your dashboard</h1>
          <p className="mt-3 text-slate-300">
            Your bookmarks, tracked topics, and search history will appear here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-cyan-400 px-5 py-2.5 font-medium text-slate-950 hover:bg-cyan-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-5 py-2.5 font-medium hover:bg-white/5"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Command Dashboard</h1>
            <p className="mt-1 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200">
              {planDefinition.name} plan
            </p>
            <p className="text-sm text-slate-300">
              Monitor events, save critical stories, and keep your tracking context.
            </p>
            {sync.status === 'loading' && (
              <p className="mt-1 text-xs text-cyan-200">
                Syncing your cloud data...
              </p>
            )}
            {sync.status === 'saving' && (
              <p className="mt-1 text-xs text-cyan-200">Saving changes...</p>
            )}
            {sync.status === 'synced' && sync.lastSyncedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Last synced {formatUtcTimestamp(sync.lastSyncedAt)}
              </p>
            )}
            {sync.status === 'error' && (
              <p className="mt-1 text-xs text-rose-300">
                Cloud sync failed. Local data is still available.
                {sync.error ? ` ${sync.error}` : ''}
              </p>
            )}
            {billingError && (
              <p className="mt-1 text-xs text-rose-300">{billingError}</p>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="rounded-md border border-cyan-400/40 px-3 py-2 text-sm text-cyan-300 md:hidden"
          >
            Filters
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold">Live Map</h2>
              <p className="text-sm text-slate-300">Click to drop pins for notable regions.</p>
            </div>
            <div className="h-[340px] sm:h-[430px]">
              <DynamicMap className="h-full w-full" />
            </div>
          </section>

          <NewsList className="min-h-[430px]" />

          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Billing Settings</h3>
              <p className="mt-1 text-sm text-slate-300">
                Current plan: <span className="font-medium">{planDefinition.name}</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                Subscription status: {billing.status}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Billing updated:{' '}
                {formatUtcTimestamp(billing.updatedAt)}
              </p>
              {sync.lastSyncedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Profile sync: {formatUtcTimestamp(sync.lastSyncedAt)}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    clearBillingError();
                    router.push('/pricing');
                  }}
                  className="rounded-md bg-cyan-400 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-300"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={() => {
                    clearBillingError();
                    void openPortal();
                  }}
                  disabled={billingLoading || billing.plan === 'free'}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {billingLoading ? 'Opening...' : 'Manage Billing'}
                </button>
              </div>
              {billing.plan === 'free' && (
                <p className="mt-2 text-xs text-slate-400">
                  Upgrade to Pro or Team to manage billing in Stripe.
                </p>
              )}
            </section>

            <NotificationCenter uid={user.uid} />

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Saved Bookmarks</h3>
              <p className="mt-1 text-xs text-slate-400">
                {bookmarks.length}/{entitlements.maxBookmarks} used
              </p>
              {bookmarks.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No bookmarks yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {bookmarks.slice(0, 6).map((bookmark) => (
                    <li key={bookmark.url}>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-cyan-300 hover:text-cyan-200"
                      >
                        {bookmark.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Recent Searches</h3>
              {recentSearches.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No searches recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {recentSearches.slice(0, 6).map((search) => (
                    <li key={search.id} className="rounded-md bg-slate-950/50 px-2 py-1.5">
                      <p className="font-medium text-slate-100">{search.query}</p>
                      <p className="text-xs text-slate-400">
                        {search.category ? `${search.category} • ` : ''}
                        {new Date(search.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Followed Categories</h3>
              <p className="mt-1 text-xs text-slate-400">
                {followedTopics.length}/{entitlements.maxFollowedTopics} followed
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((topic) => {
                  const isFollowing = followedTopics.includes(topic);

                  return (
                    <button
                      key={topic}
                      onClick={() => handleToggleTopic(topic)}
                      className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-wide ${
                        isFollowing
                          ? 'bg-cyan-500/20 text-cyan-200'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
              {followedTopics.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No topics followed yet. Pick a category to track.
                </p>
              )}
              {topicsGateOpen && (
                <div className="mt-3">
                  <UpgradePrompt
                    title="Followed topics limit reached"
                    description={`Your current plan supports up to ${entitlements.maxFollowedTopics} followed topics.`}
                    targetPlan={planDefinition.id === 'free' ? 'pro' : 'team'}
                    compact
                  />
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Saved Locations</h3>
              <p className="mt-1 text-xs text-slate-400">
                {savedLocations.length}/{entitlements.maxSavedLocations} used
              </p>
              {savedLocations.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No saved locations yet. Click on the map to pin one.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {savedLocations.slice(0, 6).map((location) => (
                    <li key={location.id} className="rounded-md bg-slate-950/50 px-2 py-2">
                      <p className="font-medium text-slate-100">{location.title}</p>
                      <p className="text-xs text-slate-400">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                      <button
                        onClick={() => handleFollowRegion(location.id)}
                        disabled={isLocationAlreadyFollowed(location.id)}
                        className="mt-2 rounded-md border border-white/20 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLocationAlreadyFollowed(location.id)
                          ? 'Region Followed'
                          : 'Follow Region'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Followed Regions</h3>
              {followedRegions.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No followed regions yet. Follow one from your saved locations.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {followedRegions.slice(0, 6).map((region) => (
                    <li key={region.id} className="rounded-md bg-slate-950/50 px-2 py-2">
                      <p className="font-medium text-slate-100">{region.name}</p>
                      <p className="text-xs text-slate-400">
                        {region.lat.toFixed(3)}, {region.lng.toFixed(3)} • {region.radiusKm}km radius
                      </p>
                      <button
                        onClick={() => dispatch(unfollowRegion(region.id))}
                        className="mt-2 rounded-md border border-rose-400/40 px-2 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/10"
                      >
                        Unfollow
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h3 className="text-lg font-semibold">Active Alerts</h3>
              {!entitlements.alertsEnabled && (
                <p className="mt-1 text-xs text-amber-200">
                  Alerts are locked on Free. Existing alerts remain visible.
                </p>
              )}

              {alerts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  No alerts yet. Create one from a topic or followed region.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {alerts.slice(0, 6).map((alert) => (
                    <li key={alert.id} className="rounded-md bg-slate-950/50 px-2 py-2">
                      <p className="font-medium text-slate-100">{alert.name}</p>
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
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => dispatch(toggleAlertEnabled(alert.id))}
                          disabled={!entitlements.alertsEnabled}
                          className="rounded-md border border-white/20 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {alert.enabled ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => dispatch(removeAlert(alert.id))}
                          disabled={!entitlements.alertsEnabled}
                          className="rounded-md border border-rose-400/40 px-2 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="mt-3 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateAlert();
                }}
              >
                <input
                  value={alertName}
                  onChange={(event) => {
                    setAlertName(event.target.value);
                    setAlertError(null);
                  }}
                  placeholder="Alert name"
                  className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
                />
                <select
                  value={alertTopic}
                  onChange={(event) => {
                    setAlertTopic(event.target.value as SupportedCategory | '');
                    setAlertError(null);
                  }}
                  className="w-full rounded-md border border-white/20 bg-slate-950/80 px-3 py-2 text-sm"
                >
                  <option value="">Any topic</option>
                  {followedTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                <select
                  value={alertRegionId}
                  onChange={(event) => {
                    setAlertRegionId(event.target.value);
                    setAlertError(null);
                  }}
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
                  className="w-full rounded-md bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
                >
                  {entitlements.alertsEnabled ? 'Create Alert' : 'Unlock Alerts'}
                </button>
              </form>

              {alertError && <p className="mt-2 text-xs text-rose-300">{alertError}</p>}
              {alertsGateOpen && !entitlements.alertsEnabled && (
                <div className="mt-3">
                  <UpgradePrompt
                    title="Alerts are available on Pro and Team"
                    description="Upgrade to create and manage alert rules across topics and regions."
                    targetPlan="pro"
                    compact
                  />
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <FilterPanel isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </main>
  );
}
