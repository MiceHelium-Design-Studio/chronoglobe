'use client';

import { auth, getFirebaseInitializationError } from '../lib/firebase';
import {
  BillingCheckoutRequest,
  BillingCheckoutResponse,
  BillingPortalResponse,
  BillingStatusResponse,
  PaidPlan,
} from '../types/billing';

class BillingClientError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BillingClientError';
    this.statusCode = statusCode;
  }
}

async function getAuthToken(): Promise<string> {
  if (!auth) {
    const initializationError = getFirebaseInitializationError();
    throw new BillingClientError(
      initializationError?.message ?? 'Billing is unavailable right now.',
      500,
    );
  }

  const user = auth.currentUser;

  if (!user) {
    throw new BillingClientError('You must be logged in to manage billing.', 401);
  }

  return user.getIdToken();
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (payload?.error && typeof payload.error === 'string') {
    return payload.error;
  }

  return fallback;
}

async function postWithAuth<TRequest, TResponse>(
  url: string,
  payload: TRequest,
  fallbackError: string,
): Promise<TResponse> {
  const token = await getAuthToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new BillingClientError(
      await readErrorMessage(response, fallbackError),
      response.status,
    );
  }

  return (await response.json()) as TResponse;
}

async function getWithAuth<TResponse>(
  url: string,
  fallbackError: string,
): Promise<TResponse> {
  const token = await getAuthToken();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new BillingClientError(
      await readErrorMessage(response, fallbackError),
      response.status,
    );
  }

  return (await response.json()) as TResponse;
}

export async function startCheckout(plan: PaidPlan): Promise<string> {
  const payload: BillingCheckoutRequest = { plan };
  const response = await postWithAuth<BillingCheckoutRequest, BillingCheckoutResponse>(
    '/api/billing/checkout',
    payload,
    'Unable to start checkout.',
  );

  return response.url;
}

export async function createPortalSession(): Promise<string> {
  const response = await postWithAuth<Record<string, never>, BillingPortalResponse>(
    '/api/billing/portal',
    {},
    'Unable to open billing portal.',
  );

  return response.url;
}

export async function fetchBillingStatus() {
  const response = await getWithAuth<BillingStatusResponse>(
    '/api/billing/status',
    'Unable to read billing status.',
  );

  return response.billing;
}

export { BillingClientError };
