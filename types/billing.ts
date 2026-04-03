import { AppPlan, UserBilling } from './plans';

export type PaidPlan = Exclude<AppPlan, 'free'>;

export interface BillingCheckoutRequest {
  plan: PaidPlan;
}

export interface BillingCheckoutResponse {
  url: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface BillingStatusResponse {
  billing: UserBilling;
}
