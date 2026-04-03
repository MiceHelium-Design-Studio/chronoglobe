import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  getBillingEnv,
  validateBillingEnv,
  validateFirebaseAdminEnv,
} from '../../../../lib/env';
import { getStripeClient } from '../../../../lib/billing/stripeClient';
import { captureExceptionWithContext } from '../../../../lib/sentryContext';
import { serverLogger } from '../../../../lib/serverLogger';
import {
  resolveUidForStripeEvent,
  syncSubscriptionBilling,
} from '../../../../lib/billing/stripeBillingService';
import {
  BillingWebhookUpdateContext,
  BillingUpdateResult,
  cleanupWebhookEventHistory,
  completeWebhookEventProcessing,
  failWebhookEventProcessing,
  getUserBillingByUid,
  markWebhookEventSkipped,
  startWebhookEventProcessing,
  updateUserBilling,
} from '../../../../lib/billing/billingState';

export const runtime = 'nodejs';

const ROUTE = '/api/billing/webhook';

interface WebhookHandlerResult {
  uid: string | null;
  result: 'updated' | 'no_change' | 'skipped';
  reason?: string;
  update?: BillingUpdateResult;
}

function getRequestId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id');

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  return crypto.randomUUID();
}

function getStripeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) {
    return null;
  }

  if (typeof customer === 'string') {
    return customer;
  }

  return customer.id;
}

function getUidFromMetadata(metadata: Record<string, string> | null | undefined): string | null {
  if (!metadata) {
    return null;
  }

  const value = metadata.firebase_uid;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  return value;
}

function getSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) {
    return null;
  }

  if (typeof subscription === 'string') {
    return subscription;
  }

  return subscription.id;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (!invoice.parent?.subscription_details?.subscription) {
    return null;
  }

  return getSubscriptionId(invoice.parent.subscription_details.subscription);
}

async function handleCheckoutCompleted(params: {
  session: Stripe.Checkout.Session;
  requestId: string;
  webhookEvent: BillingWebhookUpdateContext;
}): Promise<WebhookHandlerResult> {
  const { session, requestId, webhookEvent } = params;
  const stripeCustomerId = getStripeCustomerId(session.customer);
  const uid =
    getUidFromMetadata(session.metadata) ??
    (typeof session.client_reference_id === 'string' ? session.client_reference_id : null);

  if (!stripeCustomerId || !uid) {
    serverLogger.warn('Checkout webhook missing customer or uid mapping', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      eventType: 'checkout.session.completed',
      stripeCustomerId,
    });
    return {
      uid: uid ?? null,
      result: 'skipped',
      reason: 'missing_customer_or_uid',
    };
  }

  const existingBilling = await getUserBillingByUid(uid);
  const update = await updateUserBilling(uid, {
    ...existingBilling,
    provider: 'stripe',
    stripeCustomerId,
    updatedAt: new Date().toISOString(),
  }, {
    webhookEvent,
  });

  return {
    uid,
    result: update.updated ? 'updated' : 'no_change',
    reason: update.skipReason,
    update,
  };
}

async function handleSubscriptionEvent(params: {
  subscription: Stripe.Subscription;
  requestId: string;
  webhookEvent: BillingWebhookUpdateContext;
}): Promise<WebhookHandlerResult> {
  const { subscription, requestId, webhookEvent } = params;
  const stripeCustomerId = getStripeCustomerId(subscription.customer);

  if (!stripeCustomerId) {
    serverLogger.warn('Subscription webhook missing customer id', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      eventType: 'customer.subscription',
    });
    return {
      uid: null,
      result: 'skipped',
      reason: 'missing_customer_id',
    };
  }

  const explicitUid = getUidFromMetadata(subscription.metadata);
  const uid = await resolveUidForStripeEvent({
    explicitUid,
    stripeCustomerId,
  });

  if (!uid) {
    serverLogger.warn('Subscription webhook could not resolve uid', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      eventType: 'customer.subscription',
      stripeCustomerId,
    });
    return {
      uid: null,
      result: 'skipped',
      reason: 'missing_uid_mapping',
    };
  }

  const update = await syncSubscriptionBilling({
    uid,
    subscription,
    stripeCustomerId,
    webhookEvent,
  });

  return {
    uid,
    result: update.updated ? 'updated' : 'no_change',
    reason: update.skipReason,
    update,
  };
}

async function handleInvoicePaymentFailed(params: {
  invoice: Stripe.Invoice;
  requestId: string;
  stripe: Stripe;
  webhookEvent: BillingWebhookUpdateContext;
}): Promise<WebhookHandlerResult> {
  const { invoice, requestId, stripe, webhookEvent } = params;
  const stripeCustomerId = getStripeCustomerId(invoice.customer);

  if (!stripeCustomerId) {
    serverLogger.warn('Invoice payment failed webhook missing customer id', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      eventType: 'invoice.payment_failed',
    });
    return {
      uid: null,
      result: 'skipped',
      reason: 'missing_customer_id',
    };
  }

  const explicitUid = getUidFromMetadata(invoice.metadata);
  const uid = await resolveUidForStripeEvent({
    explicitUid,
    stripeCustomerId,
  });

  if (!uid) {
    serverLogger.warn('Invoice payment failed webhook could not resolve uid', {
      route: ROUTE,
      requestId,
      statusCode: 200,
      eventType: 'invoice.payment_failed',
      stripeCustomerId,
    });
    return {
      uid: null,
      result: 'skipped',
      reason: 'missing_uid_mapping',
    };
  }

  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    const existingBilling = await getUserBillingByUid(uid);
    const update = await updateUserBilling(uid, {
      ...existingBilling,
      plan: 'free',
      status: 'past_due',
      provider: 'stripe',
      stripeCustomerId,
      stripeSubscriptionId: null,
      updatedAt: new Date().toISOString(),
    }, {
      webhookEvent,
    });

    return {
      uid,
      result: update.updated ? 'updated' : 'no_change',
      reason: update.skipReason,
      update,
    };
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const update = await syncSubscriptionBilling({
    uid,
    subscription,
    stripeCustomerId,
    webhookEvent,
  });

  return {
    uid,
    result: update.updated ? 'updated' : 'no_change',
    reason: update.skipReason,
    update,
  };
}

function logWebhookOutcome(params: {
  requestId: string;
  eventId: string;
  eventType: string;
  attempts: number;
  outcome: WebhookHandlerResult;
}): void {
  const { requestId, eventId, eventType, attempts, outcome } = params;

  serverLogger.info('Stripe billing webhook processed', {
    route: ROUTE,
    requestId,
    statusCode: 200,
    eventId,
    eventType,
    attempts,
    result: outcome.result,
    reason: outcome.reason,
    uid: outcome.uid,
    previousPlan: outcome.update?.previous.plan,
    previousStatus: outcome.update?.previous.status,
    previousSubscriptionId: outcome.update?.previous.stripeSubscriptionId,
    currentPlan: outcome.update?.current.plan,
    currentStatus: outcome.update?.current.status,
    currentSubscriptionId: outcome.update?.current.stripeSubscriptionId,
    changed: outcome.update?.updated ?? false,
    skipReason: outcome.update?.skipReason ?? outcome.reason,
  });
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let processingEventId: string | null = null;

  try {
    validateBillingEnv();
    validateFirebaseAdminEnv();

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature header.' },
        {
          status: 400,
          headers: {
            'X-Request-Id': requestId,
          },
        },
      );
    }

    const stripe = getStripeClient();
    const env = getBillingEnv();
    const rawBody = await request.text();

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
    processingEventId = event.id;
    const webhookEvent: BillingWebhookUpdateContext = {
      eventId: event.id,
      eventType: event.type,
      eventCreated: event.created,
    };

    const lease = await startWebhookEventProcessing({
      eventId: event.id,
      eventType: event.type,
      requestId,
      eventCreated: event.created,
    });

    if (!lease.shouldProcess) {
      serverLogger.info('Stripe webhook skipped by idempotency guard', {
        route: ROUTE,
        requestId,
        statusCode: 200,
        eventId: event.id,
        eventType: event.type,
        reason: lease.reason,
        attempts: lease.attempts,
      });

      try {
        await cleanupWebhookEventHistory();
      } catch {
        // Best-effort cleanup only.
      }

      return NextResponse.json(
        { received: true, skipped: true, reason: lease.reason },
        {
          status: 200,
          headers: {
            'X-Request-Id': requestId,
          },
        },
      );
    }

    let outcome: WebhookHandlerResult;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        outcome = await handleCheckoutCompleted({ session, requestId, webhookEvent });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        outcome = await handleSubscriptionEvent({ subscription, requestId, webhookEvent });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        outcome = await handleInvoicePaymentFailed({
          invoice,
          requestId,
          stripe,
          webhookEvent,
        });
        break;
      }
      default:
        outcome = {
          uid: null,
          result: 'skipped',
          reason: 'unhandled_event_type',
        };
        break;
    }

    if (outcome.result === 'skipped') {
      await markWebhookEventSkipped({
        eventId: event.id,
        requestId,
        reason: outcome.reason ?? 'skipped',
      });
    } else {
      await completeWebhookEventProcessing({
        eventId: event.id,
        requestId,
        result: outcome.result,
        uid: outcome.uid,
      });
    }

    logWebhookOutcome({
      requestId,
      eventId: event.id,
      eventType: event.type,
      attempts: lease.attempts,
      outcome,
    });

    try {
      const cleanup = await cleanupWebhookEventHistory();

      if (cleanup.ran && cleanup.deletedCount > 0) {
        serverLogger.info('Stripe webhook event history cleanup completed', {
          route: ROUTE,
          requestId,
          statusCode: 200,
          deletedCount: cleanup.deletedCount,
          cutoffIso: cleanup.cutoffIso,
          retentionDays: cleanup.retentionDays,
        });
      }
    } catch (cleanupError) {
      serverLogger.warn('Stripe webhook event history cleanup failed', {
        route: ROUTE,
        requestId,
        statusCode: 200,
        error:
          cleanupError instanceof Error ? cleanupError.message : 'unknown-cleanup-error',
      });
    }

    return NextResponse.json(
      { received: true },
      {
        status: 200,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      serverLogger.warn('Stripe webhook signature verification failed', {
        route: ROUTE,
        requestId,
        statusCode: 400,
      });

      return NextResponse.json(
        { error: 'Invalid Stripe webhook signature.' },
        {
          status: 400,
          headers: {
            'X-Request-Id': requestId,
          },
        },
      );
    }

    if (processingEventId) {
      await failWebhookEventProcessing({
        eventId: processingEventId,
        requestId,
        errorMessage: error instanceof Error ? error.message : 'unknown-webhook-error',
      }).catch(() => undefined);
    }

    captureExceptionWithContext(error, {
      featureArea: 'api',
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    serverLogger.error('Stripe webhook handling failed', error, {
      route: ROUTE,
      requestId,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      {
        status: 500,
        headers: {
          'X-Request-Id': requestId,
        },
      },
    );
  }
}
