import { AppPlan, PlanDefinition, PlanEntitlements, UserBilling } from '../types/plans';

export const DEFAULT_PLAN: AppPlan = 'free';

export const PLAN_DEFINITIONS: Record<AppPlan, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    description: 'For individual monitoring and product discovery.',
    entitlements: {
      maxBookmarks: 25,
      maxSavedLocations: 5,
      maxFollowedTopics: 3,
      alertsEnabled: false,
      advancedFiltersEnabled: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: '$29/mo',
    description: 'For independent analysts and power users.',
    entitlements: {
      maxBookmarks: 250,
      maxSavedLocations: 50,
      maxFollowedTopics: 15,
      alertsEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    priceLabel: '$99/mo',
    description: 'For collaborative intelligence and newsroom workflows.',
    entitlements: {
      maxBookmarks: 1000,
      maxSavedLocations: 250,
      maxFollowedTopics: 50,
      alertsEnabled: true,
      advancedFiltersEnabled: true,
    },
  },
};

export function getPlanDefinition(plan: AppPlan): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}

export function getPlanEntitlements(plan: AppPlan): PlanEntitlements {
  return PLAN_DEFINITIONS[plan].entitlements;
}

export function createDefaultBilling(): UserBilling {
  return {
    plan: DEFAULT_PLAN,
    status: 'active',
    provider: 'internal',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function isLimitReached(current: number, max: number): boolean {
  return current >= max;
}

