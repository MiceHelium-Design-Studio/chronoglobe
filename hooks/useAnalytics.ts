'use client';

import { useCallback } from 'react';
import { trackEvent } from '../lib/analytics';
import { AnalyticsEventMap } from '../types/analytics';

export function useAnalytics() {
  const track = useCallback(
    <TName extends keyof AnalyticsEventMap>(
      name: TName,
      payload: AnalyticsEventMap[TName],
    ) => {
      trackEvent(name, payload);
    },
    [],
  );

  return { track };
}
