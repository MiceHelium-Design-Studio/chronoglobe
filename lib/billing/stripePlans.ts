import { AppPlan } from '../../types/plans';
import { PaidPlan } from '../../types/billing';
import { getBillingEnv } from '../env';

export interface StripePlanConfig {
  plan: PaidPlan;
  priceId: string;
}

export function isPaidPlan(plan: AppPlan): plan is PaidPlan {
  return plan === 'pro' || plan === 'team';
}

export function getStripePlanConfig(plan: PaidPlan): StripePlanConfig {
  const env = getBillingEnv();

  const config: Record<PaidPlan, StripePlanConfig> = {
    pro: {
      plan: 'pro',
      priceId: env.STRIPE_PRICE_PRO_MONTHLY,
    },
    team: {
      plan: 'team',
      priceId: env.STRIPE_PRICE_TEAM_MONTHLY,
    },
  };

  return config[plan];
}

export function getPaidPlanFromPriceId(priceId: string): PaidPlan | null {
  const env = getBillingEnv();

  if (priceId === env.STRIPE_PRICE_PRO_MONTHLY) {
    return 'pro';
  }

  if (priceId === env.STRIPE_PRICE_TEAM_MONTHLY) {
    return 'team';
  }

  return null;
}
