'use client';

import * as Sentry from '@sentry/nextjs';
import { AnalyticsEvent, AnalyticsEventMap } from '../types/analytics';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function emitToDataLayer<TName extends keyof AnalyticsEventMap>(
  event: AnalyticsEvent<TName>,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: event.name,
    payload: event.payload,
    timestamp: event.timestamp,
  });
}

export function trackEvent<TName extends keyof AnalyticsEventMap>(
  name: TName,
  payload: AnalyticsEventMap[TName],
): void {
  const event: AnalyticsEvent<TName> = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  emitToDataLayer(event);
  Sentry.addBreadcrumb({
    category: 'analytics',
    type: 'info',
    level: 'info',
    message: event.name,
    data: event.payload as Record<string, unknown>,
  });

  if (process.env.NODE_ENV !== 'production') {
    // Useful while integrating an analytics provider.
    console.info('[analytics]', event.name, event.payload);
  }
}
