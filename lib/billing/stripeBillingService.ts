import Stripe from 'stripe';
import { getGeneralAppEnv } from '../env';
import { getStripeClient } from './stripeClient';
import { getStripePlanConfig } from './stripePlans';
import {
  BillingWebhookUpdateContext,
  BillingUpdateResult,
  billingFromSubscription,
  findUidByStripeCustomerId,
  getUserBillingByUid,
  updateUserBilling,
} from './billingState';
import { PaidPlan } from '../../types/billing';

function getAppUrl(): string {
  const env = getGeneralAppEnv();
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}

async function createStripeCustomer(params: {
  uid: string;
  email: string | null;
}): Promise<string> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: params.email ?? undefined,
    metadata: {
      firebase_uid: params.uid,
    },
  });

  return customer.id;
}

export async function getOrCreateStripeCustomerId(params: {
  uid: string;
  email: string | null;
}): Promise<string> {
  const stripe = getStripeClient();
  const billing = await getUserBillingByUid(params.uid);

  if (billing.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(billing.stripeCustomerId);

      if (!('deleted' in customer && customer.deleted)) {
        return billing.stripeCustomerId;
      }
    } catch {
      // Fall through to create a fresh customer.
    }
  }

  const customerId = await createStripeCustomer(params);

  await updateUserBilling(params.uid, {
    ...billing,
    provider: 'stripe',
    stripeCustomerId: customerId,
    updatedAt: new Date().toISOString(),
  });

  return customerId;
}

export async function createCheckoutSession(params: {
  uid: string;
  email: string | null;
  plan: PaidPlan;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const appUrl = getAppUrl();
  const customerId = await getOrCreateStripeCustomerId({
    uid: params.uid,
    email: params.email,
  });
  const planConfig = getStripePlanConfig(params.plan);

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: params.uid,
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/pricing?billing=canceled`,
    metadata: {
      firebase_uid: params.uid,
      app_plan: params.plan,
    },
    subscription_data: {
      metadata: {
        firebase_uid: params.uid,
        app_plan: params.plan,
      },
    },
  });
}

export async function createBillingPortalSession(params: {
  uid: string;
  email: string | null;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient();
  const appUrl = getAppUrl();
  const customerId = await getOrCreateStripeCustomerId({
    uid: params.uid,
    email: params.email,
  });

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  });
}

export async function resolveUidForStripeEvent(params: {
  explicitUid?: string | null;
  stripeCustomerId: string;
}): Promise<string | null> {
  if (params.explicitUid && params.explicitUid.trim().length > 0) {
    return params.explicitUid;
  }

  return findUidByStripeCustomerId(params.stripeCustomerId);
}

export async function syncSubscriptionBilling(params: {
  uid: string;
  subscription: Stripe.Subscription;
  stripeCustomerId: string;
  webhookEvent?: BillingWebhookUpdateContext;
}): Promise<BillingUpdateResult> {
  const existingBilling = await getUserBillingByUid(params.uid);

  const nextBilling = billingFromSubscription({
    existingBilling,
    customerId: params.stripeCustomerId,
    subscription: params.subscription,
  });

  return updateUserBilling(params.uid, nextBilling, {
    webhookEvent: params.webhookEvent,
  });
}
