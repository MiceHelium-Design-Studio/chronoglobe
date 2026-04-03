'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setBilling } from '../../store/slices/authSlice';
import { hydrateBookmarks } from '../../store/slices/bookmarkSlice';
import { hydrateMarkers } from '../../store/slices/mapSlice';
import { hydratePreferences } from '../../store/slices/preferencesSlice';
import { hydrateWatchlist } from '../../store/slices/watchlistSlice';
import {
  resetSyncState,
  setSyncError,
  setSyncLoading,
  setSyncSaving,
  setSyncSuccess,
} from '../../store/slices/syncSlice';
import {
  loadLocalBookmarks,
  loadLocalMarkers,
  loadLocalPreferences,
  loadLocalWatchlist,
  saveLocalBookmarks,
  saveLocalMarkers,
  saveLocalPreferences,
  saveLocalWatchlist,
} from '../../lib/localPersistence';
import {
  loadUserData,
  mergeUserData,
  saveUserData,
} from '../../services/userDataService';
import { fetchBillingStatus } from '../../services/billingClient';
import { reportClientError } from '../../lib/errorTracking';
import { getFirebaseInitializationError } from '../../lib/firebase';
import { PersistableUserData, UserProfile } from '../../types/userData';

function toSyncSnapshot(payload: PersistableUserData): string {
  return JSON.stringify({
    bookmarks: payload.bookmarks,
    savedLocations: payload.savedLocations,
    preferences: payload.preferences,
    watchlist: payload.watchlist,
    recentSearches: payload.recentSearches,
  });
}

export function UserDataSync() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const bookmarks = useAppSelector((state) => state.bookmarks.bookmarks);
  const markers = useAppSelector((state) => state.map.markers);
  const preferences = useAppSelector((state) => state.preferences);
  const watchlist = useAppSelector((state) => state.watchlist);

  const localHydratedRef = useRef(false);
  const activeUidRef = useRef<string | null>(null);
  const loadingUidRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  const profileRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    if (localHydratedRef.current) {
      return;
    }

    try {
      const localBookmarks = loadLocalBookmarks();
      const localMarkers = loadLocalMarkers();
      const localPreferences = loadLocalPreferences(preferences);
      const localWatchlist = loadLocalWatchlist(localPreferences.followedTopics);

      dispatch(hydrateBookmarks(localBookmarks));
      dispatch(hydrateMarkers(localMarkers));
      dispatch(hydratePreferences(localPreferences));
      dispatch(
        hydrateWatchlist({
          followedTopics: localPreferences.followedTopics,
          followedRegions: localWatchlist.followedRegions,
          alerts: localWatchlist.alerts,
        }),
      );
    } catch (error) {
      reportClientError(error, {
        area: 'user_data_sync',
        phase: 'local_hydrate',
      });
    }

    localHydratedRef.current = true;
  }, [dispatch, preferences]);

  useEffect(() => {
    if (!localHydratedRef.current) {
      return;
    }

    try {
      saveLocalBookmarks(bookmarks);
      saveLocalMarkers(markers);
      saveLocalPreferences(preferences);
      saveLocalWatchlist({
        followedTopics: preferences.followedTopics,
        followedRegions: watchlist.followedRegions,
        alerts: watchlist.alerts,
      });
    } catch (error) {
      reportClientError(error, {
        area: 'user_data_sync',
        phase: 'local_persist',
      });
    }
  }, [bookmarks, markers, preferences, watchlist]);

  useEffect(() => {
    if (!localHydratedRef.current) {
      return;
    }

    if (!user) {
      activeUidRef.current = null;
      loadingUidRef.current = null;
      lastSavedSnapshotRef.current = '';
      profileRef.current = null;
      dispatch(resetSyncState());
      return;
    }

    if (activeUidRef.current === user.uid || loadingUidRef.current === user.uid) {
      return;
    }

    const firebaseInitializationError = getFirebaseInitializationError();
    if (firebaseInitializationError) {
      activeUidRef.current = user.uid;
      loadingUidRef.current = null;
      dispatch(setSyncError(firebaseInitializationError.message));
      return;
    }

    let cancelled = false;
    loadingUidRef.current = user.uid;

    const hydrateFromCloud = async () => {
      dispatch(setSyncLoading(user.uid));

      try {
        const remoteData = await loadUserData(user.uid);
        if (cancelled) {
          return;
        }

        const merged = mergeUserData(
          user,
          {
            bookmarks,
            savedLocations: markers,
            preferences,
            watchlist: {
              followedRegions: watchlist.followedRegions,
              alerts: watchlist.alerts,
            },
          },
          remoteData,
        );

        profileRef.current = merged.profile;
        activeUidRef.current = user.uid;

        dispatch(hydrateBookmarks(merged.bookmarks));
        dispatch(hydrateMarkers(merged.savedLocations));
        dispatch(
          hydratePreferences({
            preferredLanguage: merged.preferences.preferredLanguage,
            followedTopics: merged.preferences.followedTopics,
            recentSearches: merged.recentSearches,
          }),
        );
        dispatch(hydrateWatchlist(merged.watchlist));

        try {
          const serverBilling = await fetchBillingStatus();

          if (!cancelled) {
            dispatch(setBilling(serverBilling));
          }
        } catch (billingError) {
          reportClientError(billingError, {
            area: 'user_data_sync',
            phase: 'billing_status',
            uid: user.uid,
          });
        }

        const saved = await saveUserData(user.uid, merged);
        if (cancelled) {
          return;
        }

        profileRef.current = saved.profile;
        lastSavedSnapshotRef.current = toSyncSnapshot(saved);
        dispatch(setSyncSuccess(saved.updatedAt));
      } catch (error) {
        if (cancelled) {
          return;
        }

        reportClientError(error, {
          area: 'user_data_sync',
          phase: 'initial_load',
          uid: user.uid,
        });
        dispatch(
          setSyncError(
            error instanceof Error
              ? error.message
              : 'Failed to sync account data from cloud.',
          ),
        );
      } finally {
        if (!cancelled) {
          loadingUidRef.current = null;
        }
      }
    };

    void hydrateFromCloud();

    return () => {
      cancelled = true;
    };
  }, [bookmarks, dispatch, markers, preferences, user, watchlist]);

  useEffect(() => {
    if (!user || activeUidRef.current !== user.uid || loadingUidRef.current === user.uid) {
      return;
    }

    const firebaseInitializationError = getFirebaseInitializationError();
    if (firebaseInitializationError) {
      return;
    }

    if (!profileRef.current) {
      return;
    }

    const payload: PersistableUserData = {
      profile: {
        ...profileRef.current,
        email: user.email,
        displayName: user.displayName,
      },
      bookmarks,
      savedLocations: markers,
      preferences: {
        preferredLanguage: preferences.preferredLanguage,
        followedTopics: preferences.followedTopics,
      },
      watchlist: {
        followedTopics: preferences.followedTopics,
        followedRegions: watchlist.followedRegions,
        alerts: watchlist.alerts,
      },
      recentSearches: preferences.recentSearches,
    };

    const snapshot = toSyncSnapshot(payload);
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      const persistChanges = async () => {
        dispatch(setSyncSaving());

        try {
          const saved = await saveUserData(user.uid, payload);
          profileRef.current = saved.profile;
          lastSavedSnapshotRef.current = toSyncSnapshot(saved);
          dispatch(setSyncSuccess(saved.updatedAt));
        } catch (error) {
          reportClientError(error, {
            area: 'user_data_sync',
            phase: 'persist_changes',
            uid: user.uid,
          });
          dispatch(
            setSyncError(
              error instanceof Error
                ? error.message
                : 'Failed to persist account data changes.',
            ),
          );
        }
      };

      void persistChanges();
    }, 900);

    return () => {
      clearTimeout(timeout);
    };
  }, [bookmarks, dispatch, markers, preferences, user, watchlist]);

  return null;
}
