'use client';

import { useMemo } from 'react';
import { useAppSelector } from '../store/store';
import { getPlanDefinition, getPlanEntitlements, isLimitReached } from '../lib/entitlements';

export function useEntitlements() {
  const plan = useAppSelector((state) => state.auth.billing.plan);
  const entitlements = useMemo(() => getPlanEntitlements(plan), [plan]);
  const planDefinition = useMemo(() => getPlanDefinition(plan), [plan]);

  return {
    plan,
    planDefinition,
    entitlements,
    canAddBookmark(currentCount: number) {
      return !isLimitReached(currentCount, entitlements.maxBookmarks);
    },
    canAddSavedLocation(currentCount: number) {
      return !isLimitReached(currentCount, entitlements.maxSavedLocations);
    },
    canAddFollowedTopic(currentCount: number) {
      return !isLimitReached(currentCount, entitlements.maxFollowedTopics);
    },
  };
}

