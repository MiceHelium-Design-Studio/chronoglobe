export type AppPlan = 'free' | 'pro' | 'team';

export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled';
export type BillingProvider = 'internal' | 'stripe';

export interface PlanEntitlements {
  maxBookmarks: number;
  maxSavedLocations: number;
  maxFollowedTopics: number;
  alertsEnabled: boolean;
  advancedFiltersEnabled: boolean;
}

export interface PlanDefinition {
  id: AppPlan;
  name: string;
  priceLabel: string;
  description: string;
  entitlements: PlanEntitlements;
}

export interface UserBilling {
  plan: AppPlan;
  status: BillingStatus;
  provider: BillingProvider;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  updatedAt: string;
}

