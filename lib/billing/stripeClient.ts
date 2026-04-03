import Stripe from 'stripe';
import { getBillingEnv } from '../env';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const env = getBillingEnv();
  stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

  return stripeClient;
}
