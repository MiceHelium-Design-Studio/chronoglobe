'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '../../../components/layout/AppHeader';
import { PLAN_DEFINITIONS } from '../../../lib/entitlements';
import { formatUtcTimestamp } from '../../../lib/dateTime';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useAppSelector } from '../../../store/store';
import { AppPlan } from '../../../types/plans';
import { useBillingActions } from '../../../hooks/useBillingActions';

const plans = [
  PLAN_DEFINITIONS.free,
  PLAN_DEFINITIONS.pro,
  PLAN_DEFINITIONS.team,
];

const comparisonRows = [
  {
    label: 'Saved Bookmarks',
    free: `${PLAN_DEFINITIONS.free.entitlements.maxBookmarks}`,
    pro: `${PLAN_DEFINITIONS.pro.entitlements.maxBookmarks}`,
    team: `${PLAN_DEFINITIONS.team.entitlements.maxBookmarks}`,
  },
  {
    label: 'Saved Locations',
    free: `${PLAN_DEFINITIONS.free.entitlements.maxSavedLocations}`,
    pro: `${PLAN_DEFINITIONS.pro.entitlements.maxSavedLocations}`,
    team: `${PLAN_DEFINITIONS.team.entitlements.maxSavedLocations}`,
  },
  {
    label: 'Followed Topics',
    free: `${PLAN_DEFINITIONS.free.entitlements.maxFollowedTopics}`,
    pro: `${PLAN_DEFINITIONS.pro.entitlements.maxFollowedTopics}`,
    team: `${PLAN_DEFINITIONS.team.entitlements.maxFollowedTopics}`,
  },
  {
    label: 'Alerts',
    free: 'No',
    pro: 'Yes',
    team: 'Yes',
  },
  {
    label: 'Advanced Filters',
    free: 'No',
    pro: 'Yes',
    team: 'Yes',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const billing = useAppSelector((state) => state.auth.billing);
  const currentPlan = billing.plan;
  const { track } = useAnalytics();
  const { loading, error, clearError, beginCheckout, openPortal, refreshBilling } =
    useBillingActions();

  useEffect(() => {
    const source = document.referrer ? 'navigation' : 'direct';
    track('pricing_page_visit', { source });
  }, [track]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (searchParams.get('billing') === 'success') {
      void refreshBilling();
    }
  }, [refreshBilling, searchParams, user]);

  const billingNotice = useMemo(() => {
    const state = searchParams.get('billing');

    if (state === 'success') {
      return 'Billing updated. Refreshing your subscription status...';
    }

    if (state === 'canceled') {
      return 'Checkout was canceled. You can restart anytime.';
    }

    return null;
  }, [searchParams]);

  const handleSelectPlan = async (plan: AppPlan) => {
    clearError();

    if (plan === 'free') {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (currentPlan !== 'free') {
      await openPortal();
      return;
    }

    track('upgrade_cta_click', {
      plan,
      location: 'pricing_page',
    });

    await beginCheckout(plan);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold">Pricing</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Start free, scale when your monitoring operation needs deeper signal and
          collaboration.
        </p>
        {user && (
          <p className="mt-2 text-sm text-slate-400">
            Current status: {billing.status} • Updated{' '}
            {formatUtcTimestamp(billing.updatedAt)}
          </p>
        )}

        {billingNotice && (
          <p className="mt-4 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
            {billingNotice}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const paidUser = currentPlan !== 'free';

            return (
              <article
                key={plan.id}
                className={`rounded-2xl border bg-slate-900/70 p-6 ${
                  isCurrentPlan ? 'border-cyan-400/50' : 'border-white/10'
                }`}
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-2xl font-bold text-cyan-300">{plan.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {[
                    `Bookmarks: ${plan.entitlements.maxBookmarks}`,
                    `Saved locations: ${plan.entitlements.maxSavedLocations}`,
                    `Followed topics: ${plan.entitlements.maxFollowedTopics}`,
                    plan.entitlements.alertsEnabled ? 'Alerts enabled' : 'No alerts',
                    plan.entitlements.advancedFiltersEnabled
                      ? 'Advanced filters enabled'
                      : 'Basic filters only',
                  ].map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <button
                  className="mt-6 w-full rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void handleSelectPlan(plan.id);
                  }}
                  disabled={loading || plan.id === 'free'}
                >
                  {plan.id === 'free' && isCurrentPlan
                    ? 'Current Plan'
                    : !user && plan.id !== 'free'
                      ? 'Login to Upgrade'
                      : paidUser && plan.id !== 'free'
                        ? 'Manage Billing'
                        : plan.id === 'free'
                          ? 'Included'
                          : `Upgrade to ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/70 text-slate-200">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Free</th>
                <th className="px-4 py-3">Pro</th>
                <th className="px-4 py-3">Team</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-white/10">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 text-slate-300">{row.free}</td>
                  <td className="px-4 py-3 text-slate-300">{row.pro}</td>
                  <td className="px-4 py-3 text-slate-300">{row.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
