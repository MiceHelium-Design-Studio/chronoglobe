import Stripe from 'stripe';
import { getFirebaseAdminDb } from '../firebaseAdmin';
import { createDefaultBilling } from '../entitlements';
import { AppPlan, BillingProvider, BillingStatus, UserBilling } from '../../types/plans';
import { getPaidPlanFromPriceId } from './stripePlans';

const USERS_COLLECTION = 'users';
const WEBHOOK_EVENTS_COLLECTION = 'stripe_webhook_events';
const WEBHOOK_EVENT_STALE_MS = 2 * 60 * 1000;
const FIRESTORE_MAX_RETRIES = 3;
const WEBHOOK_EVENT_RETENTION_DAYS = 45;
const WEBHOOK_EVENT_CLEANUP_BATCH_SIZE = 200;
const WEBHOOK_EVENT_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

let lastWebhookCleanupAtMs = 0;

type WebhookEventStatus = 'processing' | 'processed' | 'failed';

export interface BillingUpdateResult {
  updated: boolean;
  previous: UserBilling;
  current: UserBilling;
  skipReason?: 'no_change' | 'stale_event';
}

export interface WebhookProcessingLease {
  shouldProcess: boolean;
  reason: 'new' | 'duplicate_processed' | 'inflight' | 'retry';
  attempts: number;
}

export interface BillingWebhookUpdateContext {
  eventId: string;
  eventType: string;
  eventCreated: number;
}

interface BillingEventState {
  lastStripeEventId: string;
  lastStripeEventType: string;
  lastStripeEventCreated: number;
  updatedAt: string;
}

export interface WebhookCleanupResult {
  ran: boolean;
  deletedCount: number;
  cutoffIso: string | null;
  retentionDays: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorCode(error: unknown): string | number | undefined {
  if (!isObject(error)) {
    return undefined;
  }

  const value = error.code;
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return undefined;
}

function isRetryableFirestoreError(error: unknown): boolean {
  const code = getErrorCode(error);
  return (
    code === 4 ||
    code === 10 ||
    code === 14 ||
    code === 'deadline-exceeded' ||
    code === 'aborted' ||
    code === 'unavailable' ||
    code === 'internal'
  );
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withFirestoreRetries<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 1;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= FIRESTORE_MAX_RETRIES || !isRetryableFirestoreError(error)) {
        throw error;
      }

      await delay(120 * attempt);
      attempt += 1;
    }
  }
}

function toUnixMs(value: unknown): number | null {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (isObject(value) && typeof value.toDate === 'function') {
    const date = value.toDate();

    if (date instanceof Date && Number.isFinite(date.getTime())) {
      return date.getTime();
    }
  }

  return null;
}

function getWebhookRetentionMs(): number {
  return WEBHOOK_EVENT_RETENTION_DAYS * DAY_MS;
}

function getWebhookExpiryIso(nowMs: number): string {
  return new Date(nowMs + getWebhookRetentionMs()).toISOString();
}

function sanitizeBillingEventState(value: unknown): BillingEventState | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.lastStripeEventId !== 'string' ||
    typeof value.lastStripeEventType !== 'string' ||
    typeof value.lastStripeEventCreated !== 'number' ||
    !Number.isFinite(value.lastStripeEventCreated) ||
    typeof value.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    lastStripeEventId: value.lastStripeEventId,
    lastStripeEventType: value.lastStripeEventType,
    lastStripeEventCreated: value.lastStripeEventCreated,
    updatedAt: value.updatedAt,
  };
}

function toAllowedPlan(value: unknown): AppPlan {
  return value === 'pro' || value === 'team' ? value : 'free';
}

function toAllowedStatus(value: unknown): BillingStatus {
  return value === 'trialing' ||
    value === 'past_due' ||
    value === 'canceled' ||
    value === 'active'
    ? value
    : 'active';
}

function toAllowedProvider(value: unknown): BillingProvider {
  return value === 'stripe' ? 'stripe' : 'internal';
}

export function sanitizeBilling(value: unknown): UserBilling {
  const fallback = createDefaultBilling();

  if (!isObject(value)) {
    return fallback;
  }

  return {
    plan: toAllowedPlan(value.plan),
    status: toAllowedStatus(value.status),
    provider: toAllowedProvider(value.provider),
    stripeCustomerId:
      typeof value.stripeCustomerId === 'string' && value.stripeCustomerId.trim().length > 0
        ? value.stripeCustomerId
        : null,
    stripeSubscriptionId:
      typeof value.stripeSubscriptionId === 'string' && value.stripeSubscriptionId.trim().length > 0
        ? value.stripeSubscriptionId
        : null,
    updatedAt:
      typeof value.updatedAt === 'string' ? value.updatedAt : fallback.updatedAt,
  };
}

export function mapStripeStatusToBillingStatus(
  status: Stripe.Subscription.Status,
): BillingStatus {
  if (status === 'trialing') {
    return 'trialing';
  }

  if (status === 'active') {
    return 'active';
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    return 'canceled';
  }

  return 'past_due';
}

function shouldUsePaidPlan(status: BillingStatus): boolean {
  return status === 'active' || status === 'trialing';
}

function getPrimaryPriceId(subscription: Stripe.Subscription): string | null {
  const firstItem = subscription.items.data[0];
  if (!firstItem?.price?.id) {
    return null;
  }

  return firstItem.price.id;
}

function sameBillingState(a: UserBilling, b: UserBilling): boolean {
  return (
    a.plan === b.plan &&
    a.status === b.status &&
    a.provider === b.provider &&
    a.stripeCustomerId === b.stripeCustomerId &&
    a.stripeSubscriptionId === b.stripeSubscriptionId
  );
}

export function billingFromSubscription(params: {
  existingBilling: UserBilling;
  customerId: string | null;
  subscription: Stripe.Subscription;
}): UserBilling {
  const { existingBilling, customerId, subscription } = params;
  const status = mapStripeStatusToBillingStatus(subscription.status);
  const planFromPrice = (() => {
    const priceId = getPrimaryPriceId(subscription);

    if (!priceId) {
      return null;
    }

    return getPaidPlanFromPriceId(priceId);
  })();

  const plan =
    shouldUsePaidPlan(status) && planFromPrice
      ? planFromPrice
      : ('free' as const);

  return {
    plan,
    status,
    provider: customerId ? 'stripe' : existingBilling.provider,
    stripeCustomerId: customerId ?? existingBilling.stripeCustomerId,
    stripeSubscriptionId: plan === 'free' ? null : subscription.id,
    updatedAt: new Date().toISOString(),
  };
}

export async function getUserBillingByUid(uid: string): Promise<UserBilling> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!doc.exists) {
    return createDefaultBilling();
  }

  const data = doc.data();
  return sanitizeBilling(data?.billing);
}

export async function updateUserBilling(
  uid: string,
  billing: UserBilling,
  options?: {
    webhookEvent?: BillingWebhookUpdateContext;
  },
): Promise<BillingUpdateResult> {
  const db = getFirebaseAdminDb();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);

  return withFirestoreRetries(async () => {
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const snapshotData = snapshot.data();
      const previous = sanitizeBilling(snapshotData?.billing);
      const previousEventState = sanitizeBillingEventState(snapshotData?.billingEventState);
      const now = new Date().toISOString();
      const webhookEvent = options?.webhookEvent;

      if (
        webhookEvent &&
        previousEventState &&
        previousEventState.lastStripeEventCreated > webhookEvent.eventCreated
      ) {
        return {
          updated: false,
          previous,
          current: previous,
          skipReason: 'stale_event',
        };
      }

      const nextBilling: UserBilling = {
        ...billing,
        updatedAt: now,
      };

      if (sameBillingState(previous, nextBilling)) {
        return {
          updated: false,
          previous,
          current: previous,
          skipReason: 'no_change',
        };
      }

      const nextEventState: BillingEventState | null = webhookEvent
        ? {
            lastStripeEventId: webhookEvent.eventId,
            lastStripeEventType: webhookEvent.eventType,
            lastStripeEventCreated: webhookEvent.eventCreated,
            updatedAt: now,
          }
        : null;

      transaction.set(
        userRef,
        {
          billing: nextBilling,
          ...(nextEventState ? { billingEventState: nextEventState } : {}),
          updatedAt: now,
        },
        { merge: true },
      );

      return {
        updated: true,
        previous,
        current: nextBilling,
      };
    });
  });
}

export async function startWebhookEventProcessing(params: {
  eventId: string;
  eventType: string;
  requestId: string;
  eventCreated: number;
}): Promise<WebhookProcessingLease> {
  const db = getFirebaseAdminDb();
  const eventRef = db.collection(WEBHOOK_EVENTS_COLLECTION).doc(params.eventId);
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const expiresAt = getWebhookExpiryIso(nowMs);

  return withFirestoreRetries(async () => {
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(eventRef);

      if (!snapshot.exists) {
        transaction.create(eventRef, {
          eventId: params.eventId,
          eventType: params.eventType,
          eventCreated: params.eventCreated,
          status: 'processing' as WebhookEventStatus,
          attempts: 1,
          lastRequestId: params.requestId,
          createdAt: now,
          updatedAt: now,
          expiresAt,
        });

        return {
          shouldProcess: true,
          reason: 'new' as const,
          attempts: 1,
        };
      }

      const data = snapshot.data() ?? {};
      const status =
        data.status === 'processed' || data.status === 'processing' || data.status === 'failed'
          ? (data.status as WebhookEventStatus)
          : 'failed';
      const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
      const updatedAtMs = toUnixMs(data.updatedAt);

      if (status === 'processed') {
        return {
          shouldProcess: false,
          reason: 'duplicate_processed' as const,
          attempts,
        };
      }

      if (
        status === 'processing' &&
        updatedAtMs !== null &&
        Date.now() - updatedAtMs < WEBHOOK_EVENT_STALE_MS
      ) {
        return {
          shouldProcess: false,
          reason: 'inflight' as const,
          attempts,
        };
      }

      const nextAttempts = attempts + 1;
      transaction.set(
        eventRef,
        {
          eventType: params.eventType,
          eventCreated: params.eventCreated,
          status: 'processing' as WebhookEventStatus,
          attempts: nextAttempts,
          lastRequestId: params.requestId,
          updatedAt: now,
          expiresAt,
        },
        { merge: true },
      );

      return {
        shouldProcess: true,
        reason: 'retry' as const,
        attempts: nextAttempts,
      };
    });
  });
}

export async function completeWebhookEventProcessing(params: {
  eventId: string;
  requestId: string;
  result: 'updated' | 'no_change' | 'skipped';
  uid?: string | null;
}): Promise<void> {
  const db = getFirebaseAdminDb();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();

  await withFirestoreRetries(async () => {
    await db.collection(WEBHOOK_EVENTS_COLLECTION).doc(params.eventId).set(
      {
        status: 'processed' as WebhookEventStatus,
        result: params.result,
        lastRequestId: params.requestId,
        uid: params.uid ?? null,
        processedAt: now,
        updatedAt: now,
        expiresAt: getWebhookExpiryIso(nowMs),
      },
      { merge: true },
    );
  });
}

export async function failWebhookEventProcessing(params: {
  eventId: string;
  requestId: string;
  errorMessage: string;
}): Promise<void> {
  const db = getFirebaseAdminDb();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();

  await withFirestoreRetries(async () => {
    await db.collection(WEBHOOK_EVENTS_COLLECTION).doc(params.eventId).set(
      {
        status: 'failed' as WebhookEventStatus,
        lastError: params.errorMessage,
        lastRequestId: params.requestId,
        updatedAt: now,
        expiresAt: getWebhookExpiryIso(nowMs),
      },
      { merge: true },
    );
  });
}

export async function markWebhookEventSkipped(params: {
  eventId: string;
  requestId: string;
  reason: string;
}): Promise<void> {
  const db = getFirebaseAdminDb();
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();

  await withFirestoreRetries(async () => {
    await db.collection(WEBHOOK_EVENTS_COLLECTION).doc(params.eventId).set(
      {
        status: 'processed' as WebhookEventStatus,
        result: 'skipped',
        skipReason: params.reason,
        lastRequestId: params.requestId,
        processedAt: now,
        updatedAt: now,
        expiresAt: getWebhookExpiryIso(nowMs),
      },
      { merge: true },
    );
  });
}

export async function cleanupWebhookEventHistory(params?: {
  force?: boolean;
}): Promise<WebhookCleanupResult> {
  const nowMs = Date.now();
  const shouldRun =
    params?.force ||
    nowMs - lastWebhookCleanupAtMs >= WEBHOOK_EVENT_CLEANUP_INTERVAL_MS;

  if (!shouldRun) {
    return {
      ran: false,
      deletedCount: 0,
      cutoffIso: null,
      retentionDays: WEBHOOK_EVENT_RETENTION_DAYS,
    };
  }

  lastWebhookCleanupAtMs = nowMs;
  const db = getFirebaseAdminDb();
  const cutoffIso = new Date(nowMs - getWebhookRetentionMs()).toISOString();

  const deletedCount = await withFirestoreRetries(async () => {
    const staleSnapshot = await db
      .collection(WEBHOOK_EVENTS_COLLECTION)
      .where('updatedAt', '<=', cutoffIso)
      .limit(WEBHOOK_EVENT_CLEANUP_BATCH_SIZE)
      .get();

    if (staleSnapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    staleSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return staleSnapshot.size;
  });

  return {
    ran: true,
    deletedCount,
    cutoffIso,
    retentionDays: WEBHOOK_EVENT_RETENTION_DAYS,
  };
}

export async function findUidByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('billing.stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0]?.id ?? null;
}
