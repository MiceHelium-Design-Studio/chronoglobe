'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { hydratePreferences } from '../../store/slices/preferencesSlice';
import { PreferencesState } from '../../types/preferences';

const STORAGE_KEY = 'atlaswire.preferences.v1';

function isPreferencesState(value: unknown): value is PreferencesState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PreferencesState;

  return (
    Array.isArray(candidate.followedTopics) &&
    Array.isArray(candidate.recentSearches) &&
    typeof candidate.preferredLanguage === 'string'
  );
}

export function PreferencesSync() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      hydratedRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPreferencesState(parsed)) {
        dispatch(hydratePreferences(parsed));
      }
    } catch {
      // Ignore malformed data and continue with defaults.
    } finally {
      hydratedRef.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return null;
}
