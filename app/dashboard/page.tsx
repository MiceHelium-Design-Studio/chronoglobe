'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UpgradePrompt } from '../../components/entitlements/UpgradePrompt';
import NewsList from '../../components/news/NewsList';
import FilterPanel from '../../components/filters/FilterPanel';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import {
  CommandSection,
  CommandSidebar,
} from '../../components/dashboard/CommandSidebar';
import { CommandTopBar } from '../../components/dashboard/CommandTopBar';
import { KpiCardsRow } from '../../components/dashboard/KpiCardsRow';
import { IntelSummaryCards } from '../../components/dashboard/IntelSummaryCards';
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
import { setFilters } from '../../store/slices/newsSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';

const DynamicMap = dynamic(() => import('../../components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-300">
      Loading map intelligence layer...
    </div>
  ),
});

const panelClassName =
  'rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_34px_90px_-68px_rgba(6,182,212,0.95)]';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const billing = useAppSelector((state) => state.auth.billing);
  const bookmarks = useAppSelector((state) => state.bookmarks.bookmarks);
  const savedLocations = useAppSelector((state) => state.map.markers);
  const news = useAppSelector((state) => state.news);
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
  const [activeSection, setActiveSection] = useState<CommandSection>('overview');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [topicsGateOpen, setTopicsGateOpen] = useState(false);
  const [alertsGateOpen, setAlertsGateOpen] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertTopic, setAlertTopic] = useState<SupportedCategory | ''>('');
  const [alertRegionId, setAlertRegionId] = useState('');
  const [alertError, setAlertError] = useState<string | null>(null);

  const overviewRef = useRef<HTMLElement | null>(null);
  const eventsRef = useRef<HTMLElement | null>(null);
  const usersRef = useRef<HTMLElement | null>(null);
  const sourcesRef = useRef<HTMLElement | null>(null);
  const analyticsRef = useRef<HTMLElement | null>(null);
  const billingRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (searchParams.get('billing') === 'success') {
      void refreshBilling();
    }
  }, [refreshBilling, searchParams, user]);

  const sectionRefs: Record<CommandSection, RefObject<HTMLElement | null>> = {
    overview: overviewRef,
    events: eventsRef,
    users: usersRef,
    sources: sourcesRef,
    analytics: analyticsRef,
    billing: billingRef,
    settings: settingsRef,
  };

  const jumpToSection = (section: CommandSection) => {
    setActiveSection(section);
    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const topRegions = useMemo(() => {
    if (followedRegions.length > 0) {
      return followedRegions.slice(0, 3).map((region) => ({
        id: region.id,
        name: region.name,
        detail: `${region.radiusKm}km watch radius • ${region.lat.toFixed(2)}, ${region.lng.toFixed(2)}`,
      }));
    }

    return savedLocations.slice(0, 3).map((location) => ({
      id: location.id,
      name: location.title,
      detail: `Pinned source • ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
    }));
  }, [followedRegions, savedLocations]);

  const activityScore =
    news.articles.length + alerts.filter((alert) => alert.enabled).length * 2 + followedTopics.length;

  const activityLevel = activityScore > 18 ? 'Elevated' : activityScore > 7 ? 'Moderate' : 'Low';

  const signalIntensity =
    bookmarks.length + followedRegions.length + recentSearches.length > 24
      ? 'High'
      : bookmarks.length + followedRegions.length + recentSearches.length > 10
        ? 'Focused'
        : 'Calm';

  const systemStatus =
    sync.status === 'error' || Boolean(billingError) || Boolean(news.error)
      ? 'attention'
      : 'nominal';

  const notificationHintCount =
    alerts.filter((alert) => alert.enabled).length + (sync.status === 'error' ? 1 : 0);

  const kpiCards = [
    {
      id: 'api-health',
      label: 'API Health',
      value: news.error ? 'Degraded' : news.loading ? 'Polling' : 'Operational',
      hint: news.error ? 'Investigate upstream /api/news failures.' : 'Ingestion endpoint healthy.',
      tone: news.error ? 'warn' : 'good',
    },
    {
      id: 'operators',
      label: 'Active Operators',
      value: user ? '1 Online' : '0',
      hint: `${followedTopics.length} topics tracked • ${followedRegions.length} regions watched`,
      tone: 'neutral',
    },
    {
      id: 'sentry',
      label: 'Error Watch',
      value: sync.status === 'error' || billingError ? 'Attention' : 'Stable',
      hint: sync.status === 'error' ? 'Cloud sync issue detected.' : 'No critical telemetry spikes.',
      tone: sync.status === 'error' || billingError ? 'warn' : 'good',
    },
  ] as const;

  const handleExportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      plan: billing.plan,
      bookmarks: bookmarks.length,
      followedTopics,
      followedRegions: followedRegions.map((region) => region.name),
      activeAlerts: alerts.filter((alert) => alert.enabled).length,
      recentSearches: recentSearches.slice(0, 10),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `chronoglobe-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);

  };

  const handleGenerateIntel = () => {
    jumpToSection('events');
    dispatch(setFilters({ q: (news.filters.q || '').trim() }));
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#04060c] text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">
            ChronoGlobe Command
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Operator access required</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Authenticate to unlock the intelligence command center, event ingestion,
            watchlists, and regional analytics surfaces.
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04060c] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(850px 520px at 8% -8%, rgba(6,182,212,0.2), transparent 55%), radial-gradient(950px 560px at 100% 0%, rgba(59,130,246,0.18), transparent 58%), linear-gradient(180deg, rgba(15,23,42,0.48), rgba(2,6,23,0.96))',
        }}
      />

      <div className="relative mx-auto max-w-[1600px] px-3 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <CommandSidebar
            activeSection={activeSection}
            onSelect={jumpToSection}
            planName={planDefinition.name}
            sync={sync}
          />

          <div className="min-w-0 space-y-4">
            <CommandTopBar
              systemStatus={systemStatus}
              operatorName={user.displayName || 'Field Operator'}
              operatorEmail={user.email || 'operator@chronoglobe.local'}
              notificationCount={notificationHintCount}
              onOpenNotifications={() => jumpToSection('analytics')}
            />

            <section ref={overviewRef} className={`${panelClassName} px-4 py-5 sm:px-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Intelligence Dashboard
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Global signal operations console
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-300">
                    Monitor geopolitical and sector signals, prioritize source confidence,
                    and coordinate watchlist activity from one unified command surface.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportReport}
                    className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/5"
                  >
                    Export Report
                  </button>
                  <button
                    onClick={handleGenerateIntel}
                    className="rounded-md bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Generate Intel
                  </button>
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="rounded-md border border-cyan-400/40 px-3 py-2 text-xs text-cyan-200 md:hidden"
                  >
                    Filters
                  </button>
                </div>
              </div>
            </section>

            <KpiCardsRow cards={[...kpiCards]} />

            <section ref={eventsRef} className="grid gap-4 2xl:grid-cols-[1.65fr_1fr]">
              <NewsList className="min-h-[620px]" />

              <section ref={billingRef} className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Billing</p>
                <h3 className="mt-1 text-lg font-semibold">Subscription Command</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Current plan: <span className="font-medium text-slate-100">{planDefinition.name}</span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                  Status: {billing.status}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Billing updated {formatUtcTimestamp(billing.updatedAt)}
                </p>
                {billingError && <p className="mt-2 text-xs text-rose-300">{billingError}</p>}
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
                    Upgrade to Pro or Team to open Stripe billing controls.
                  </p>
                )}
              </section>
            </section>

            <section ref={sourcesRef} className="grid gap-4 2xl:grid-cols-[1.65fr_1fr]">
              <section className={`${panelClassName} overflow-hidden`}>
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Sources</p>
                  <h3 className="mt-1 text-lg font-semibold">Global Heatmap Layer</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Pin locations on the map to add regional context to your watchlists.
                  </p>
                </div>
                <div className="h-[440px]">
                  <DynamicMap className="h-full w-full" />
                </div>
              </section>

              <IntelSummaryCards
                topRegions={topRegions}
                activityLevel={activityLevel}
                signalIntensity={signalIntensity}
              />
            </section>

            <section ref={usersRef} className="grid gap-4 xl:grid-cols-2">
              <section className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Users</p>
                <h3 className="mt-1 text-lg font-semibold">Saved Bookmarks</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {bookmarks.length}/{entitlements.maxBookmarks} used
                </p>
                {bookmarks.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">No bookmarks yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {bookmarks.slice(0, 8).map((bookmark) => (
                      <li key={bookmark.url} className="rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2">
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

              <section className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Users</p>
                <h3 className="mt-1 text-lg font-semibold">Recent Searches</h3>
                {recentSearches.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">No searches recorded yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {recentSearches.slice(0, 8).map((search) => (
                      <li
                        key={search.id}
                        className="rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2"
                      >
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
            </section>

            <section ref={analyticsRef}>
              <NotificationCenter uid={user.uid} className={panelClassName} />
            </section>

            <section ref={settingsRef} className="grid gap-4 xl:grid-cols-3">
              <section className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Global Settings</p>
                <h3 className="mt-1 text-lg font-semibold">Followed Categories</h3>
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
                            ? 'bg-cyan-500/20 text-cyan-100'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
                {followedTopics.length === 0 && (
                  <p className="mt-2 text-sm text-slate-400">
                    No topics followed yet. Pick categories to monitor.
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

              <section className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Global Settings</p>
                <h3 className="mt-1 text-lg font-semibold">Tracked Regions</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {savedLocations.length}/{entitlements.maxSavedLocations} pinned locations
                </p>
                {savedLocations.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Add map pins to define monitored regions.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {savedLocations.slice(0, 6).map((location) => (
                      <li key={location.id} className="rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2">
                        <p className="font-medium text-slate-100">{location.title}</p>
                        <p className="text-xs text-slate-400">
                          {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                        </p>
                        <button
                          onClick={() => handleFollowRegion(location.id)}
                          disabled={isLocationAlreadyFollowed(location.id)}
                          className="mt-2 rounded-md border border-white/20 px-2 py-1 text-xs text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLocationAlreadyFollowed(location.id) ? 'Region Followed' : 'Follow Region'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {followedRegions.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {followedRegions.slice(0, 4).map((region) => (
                      <li key={region.id} className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2">
                        <p className="text-sm font-medium text-cyan-100">{region.name}</p>
                        <button
                          onClick={() => dispatch(unfollowRegion(region.id))}
                          className="mt-1 text-xs text-rose-200 hover:text-rose-100"
                        >
                          Unfollow
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={`${panelClassName} p-4`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Global Settings</p>
                <h3 className="mt-1 text-lg font-semibold">Active Alerts</h3>
                {!entitlements.alertsEnabled && (
                  <p className="mt-1 text-xs text-amber-200">
                    Alerts are available on Pro and Team tiers.
                  </p>
                )}

                {alerts.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No alerts configured. Build one from a topic or followed region.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {alerts.slice(0, 6).map((alert) => (
                      <li key={alert.id} className="rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2">
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
                            className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-100 hover:bg-white/5 disabled:opacity-60"
                          >
                            {alert.enabled ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => dispatch(removeAlert(alert.id))}
                            disabled={!entitlements.alertsEnabled}
                            className="rounded-md border border-rose-400/40 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
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
            </section>
          </div>
        </div>
      </div>

      <FilterPanel isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </main>
  );
}
