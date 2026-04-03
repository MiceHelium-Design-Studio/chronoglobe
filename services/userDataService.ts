import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createDefaultBilling } from '../lib/entitlements';
import { db } from '../lib/firebase';
import { SavedLocation } from '../types/map';
import { NewsArticle } from '../types/news';
import {
  CATEGORY_OPTIONS,
  PreferencesState,
  RecentSearch,
  SupportedCategory,
} from '../types/preferences';
import {
  PersistableUserData,
  PersistedPreferences,
  SavedUserDataSnapshot,
  UserDataDocument,
  UserProfile,
} from '../types/userData';
import {
  AppPlan,
  BillingProvider,
  BillingStatus,
  UserBilling,
} from '../types/plans';
import {
  AlertRule,
  FollowedRegion,
  PersistedWatchlist,
} from '../types/watchlist';

const USERS_COLLECTION = 'users';
const USER_DATA_VERSION = 1;
const MAX_RECENT_SEARCHES = 20;
const MAX_PERSIST_RETRIES = 2;

const categorySet = new Set<SupportedCategory>(CATEGORY_OPTIONS);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getErrorCode(value: unknown): string | null {
  if (!isObject(value)) {
    return null;
  }

  return typeof value.code === 'string' ? value.code : null;
}

function isRetryablePersistenceError(error: unknown): boolean {
  const code = getErrorCode(error);

  return (
    code === 'aborted' ||
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'resource-exhausted'
  );
}

async function persistUserDataWithRetry(uid: string, data: SavedUserDataSnapshot): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);

  for (let attempt = 1; attempt <= MAX_PERSIST_RETRIES; attempt += 1) {
    try {
      await setDoc(
        userRef,
        {
          version: USER_DATA_VERSION,
          profile: data.profile,
          bookmarks: data.bookmarks,
          savedLocations: data.savedLocations,
          preferences: data.preferences,
          watchlist: data.watchlist,
          recentSearches: data.recentSearches,
          updatedAt: data.updatedAt,
        },
        { merge: true },
      );
      return;
    } catch (error) {
      if (attempt >= MAX_PERSIST_RETRIES || !isRetryablePersistenceError(error)) {
        throw error;
      }
    }
  }
}

function sanitizeArticle(value: unknown): NewsArticle | null {
  if (!isObject(value)) {
    return null;
  }

  if (typeof value.url !== 'string' || typeof value.title !== 'string') {
    return null;
  }

  const sourceName =
    isObject(value.source) && typeof value.source.name === 'string'
      ? value.source.name
      : 'Unknown Source';

  return {
    title: value.title,
    description: typeof value.description === 'string' ? value.description : null,
    url: value.url,
    urlToImage: typeof value.urlToImage === 'string' ? value.urlToImage : null,
    publishedAt:
      typeof value.publishedAt === 'string'
        ? value.publishedAt
        : new Date().toISOString(),
    source: { name: sourceName },
    author: typeof value.author === 'string' ? value.author : null,
    content: typeof value.content === 'string' ? value.content : null,
  };
}

function dedupeBookmarks(bookmarks: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();

  return bookmarks.filter((bookmark) => {
    if (seen.has(bookmark.url)) {
      return false;
    }

    seen.add(bookmark.url);
    return true;
  });
}

function dedupeSavedLocations(savedLocations: SavedLocation[]): SavedLocation[] {
  const seen = new Set<string>();

  return savedLocations.filter((location) => {
    const key = `${location.lat.toFixed(5)}:${location.lng.toFixed(5)}:${location.title.trim().toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeFollowedRegions(regions: FollowedRegion[]): FollowedRegion[] {
  const seen = new Set<string>();

  return regions.filter((region) => {
    const locationKey =
      region.sourceLocationId ??
      `${region.lat.toFixed(5)}:${region.lng.toFixed(5)}:${region.name.trim().toLowerCase()}`;

    if (seen.has(locationKey)) {
      return false;
    }

    seen.add(locationKey);
    return true;
  });
}

function dedupeAlerts(alerts: AlertRule[]): AlertRule[] {
  const seen = new Set<string>();

  return alerts.filter((alert) => {
    if (seen.has(alert.id)) {
      return false;
    }

    seen.add(alert.id);
    return true;
  });
}

function sanitizeBookmarks(value: unknown): NewsArticle[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .map((item) => sanitizeArticle(item))
    .filter((item): item is NewsArticle => item !== null);

  return dedupeBookmarks(sanitized);
}

function sanitizeSavedLocation(value: unknown): SavedLocation | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.lat !== 'number' ||
    typeof value.lng !== 'number'
  ) {
    return null;
  }

  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) {
    return null;
  }

  return {
    id: value.id,
    title: value.title.trim().length > 0 ? value.title : 'Pinned location',
    lat: value.lat,
    lng: value.lng,
  };
}

function sanitizeSavedLocations(value: unknown): SavedLocation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeSavedLocations(
    value
      .map((item) => sanitizeSavedLocation(item))
      .filter((item): item is SavedLocation => item !== null),
  );
}

function sanitizeFollowedTopics(value: unknown): SupportedCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is SupportedCategory =>
          typeof item === 'string' && categorySet.has(item as SupportedCategory),
      ),
    ),
  );
}

function sanitizeFollowedRegion(value: unknown): FollowedRegion | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.lat !== 'number' ||
    typeof value.lng !== 'number' ||
    typeof value.radiusKm !== 'number'
  ) {
    return null;
  }

  if (
    !Number.isFinite(value.lat) ||
    !Number.isFinite(value.lng) ||
    !Number.isFinite(value.radiusKm) ||
    value.radiusKm <= 0
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim().length > 0 ? value.name : 'Tracked region',
    lat: value.lat,
    lng: value.lng,
    radiusKm: value.radiusKm,
    sourceLocationId:
      typeof value.sourceLocationId === 'string' &&
      value.sourceLocationId.trim().length > 0
        ? value.sourceLocationId
        : null,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
  };
}

function sanitizeFollowedRegions(value: unknown): FollowedRegion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeFollowedRegions(
    value
      .map((item) => sanitizeFollowedRegion(item))
      .filter((item): item is FollowedRegion => item !== null),
  );
}

function sanitizeAlert(value: unknown, regionIds: Set<string>): AlertRule | null {
  if (!isObject(value) || typeof value.name !== 'string') {
    return null;
  }

  const topic =
    typeof value.topic === 'string' && categorySet.has(value.topic as SupportedCategory)
      ? (value.topic as SupportedCategory)
      : null;

  const regionId =
    typeof value.regionId === 'string' && regionIds.has(value.regionId)
      ? value.regionId
      : null;

  const name = value.name.trim();
  if (name.length === 0) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === 'string'
      ? value.createdAt
      : new Date().toISOString();

  return {
    id:
      typeof value.id === 'string' && value.id.trim().length > 0
        ? value.id
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    topic,
    regionId,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    createdAt,
    updatedAt:
      typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
  };
}

function sanitizeAlerts(value: unknown, followedRegions: FollowedRegion[]): AlertRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const regionIds = new Set(followedRegions.map((region) => region.id));

  return dedupeAlerts(
    value
      .map((item) => sanitizeAlert(item, regionIds))
      .filter((item): item is AlertRule => item !== null),
  );
}

function sanitizeWatchlist(
  value: unknown,
  fallbackTopics: SupportedCategory[],
): PersistedWatchlist {
  if (!isObject(value)) {
    return {
      followedTopics: fallbackTopics,
      followedRegions: [],
      alerts: [],
    };
  }

  const followedRegions = sanitizeFollowedRegions(value.followedRegions);
  const followedTopics = sanitizeFollowedTopics(value.followedTopics);

  return {
    followedTopics: followedTopics.length > 0 ? followedTopics : fallbackTopics,
    followedRegions,
    alerts: sanitizeAlerts(value.alerts, followedRegions),
  };
}

function sanitizeRecentSearch(value: unknown): RecentSearch | null {
  if (!isObject(value) || typeof value.query !== 'string') {
    return null;
  }

  const category =
    typeof value.category === 'string' && categorySet.has(value.category as SupportedCategory)
      ? (value.category as SupportedCategory)
      : undefined;

  return {
    id:
      typeof value.id === 'string' && value.id.trim().length > 0
        ? value.id
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    query: value.query,
    category,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
  };
}

function sortAndLimitRecentSearches(searches: RecentSearch[]): RecentSearch[] {
  const deduped = new Map<string, RecentSearch>();

  searches.forEach((search) => {
    const key = `${search.query.toLowerCase()}::${search.category ?? ''}`;
    const existing = deduped.get(key);

    if (!existing || new Date(search.createdAt) > new Date(existing.createdAt)) {
      deduped.set(key, search);
    }
  });

  return Array.from(deduped.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_RECENT_SEARCHES);
}

function sanitizeRecentSearches(value: unknown): RecentSearch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .map((item) => sanitizeRecentSearch(item))
    .filter((item): item is RecentSearch => item !== null);

  return sortAndLimitRecentSearches(sanitized);
}

function sanitizePreferences(value: unknown): PersistedPreferences {
  if (!isObject(value)) {
    return {
      preferredLanguage: 'en',
      followedTopics: [],
    };
  }

  return {
    preferredLanguage:
      typeof value.preferredLanguage === 'string' && value.preferredLanguage.length > 0
        ? value.preferredLanguage
        : 'en',
    followedTopics: sanitizeFollowedTopics(value.followedTopics),
  };
}

function sanitizeProfile(value: unknown, uid: string): UserProfile {
  if (!isObject(value)) {
    const now = new Date().toISOString();

    return {
      uid,
      email: null,
      displayName: null,
      createdAt: now,
      lastLoginAt: now,
    };
  }

  const now = new Date().toISOString();

  return {
    uid,
    email: typeof value.email === 'string' ? value.email : null,
    displayName: typeof value.displayName === 'string' ? value.displayName : null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    lastLoginAt: typeof value.lastLoginAt === 'string' ? value.lastLoginAt : now,
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

function sanitizeBilling(value: unknown): UserBilling {
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
      typeof value.stripeSubscriptionId === 'string' &&
      value.stripeSubscriptionId.trim().length > 0
        ? value.stripeSubscriptionId
        : null,
    updatedAt:
      typeof value.updatedAt === 'string' ? value.updatedAt : fallback.updatedAt,
  };
}

function sanitizeRemoteDocument(uid: string, value: unknown): UserDataDocument {
  const data = isObject(value) ? value : {};
  const preferences = sanitizePreferences(data.preferences);
  const watchlist = sanitizeWatchlist(data.watchlist, preferences.followedTopics);
  const normalizedTopics = sanitizeFollowedTopics([
    ...watchlist.followedTopics,
    ...preferences.followedTopics,
  ]);

  return {
    version: USER_DATA_VERSION,
    profile: sanitizeProfile(data.profile, uid),
    billing: sanitizeBilling(data.billing),
    bookmarks: sanitizeBookmarks(data.bookmarks),
    savedLocations: sanitizeSavedLocations(data.savedLocations),
    preferences: {
      ...preferences,
      followedTopics: normalizedTopics,
    },
    watchlist: {
      ...watchlist,
      followedTopics: normalizedTopics,
    },
    recentSearches: sanitizeRecentSearches(data.recentSearches),
    updatedAt:
      typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
}

export async function loadUserData(uid: string): Promise<UserDataDocument | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return sanitizeRemoteDocument(uid, snapshot.data());
}

export function mergeUserData(
  user: User,
  localState: {
    bookmarks: NewsArticle[];
    savedLocations: SavedLocation[];
    preferences: PreferencesState;
    watchlist: Pick<PersistedWatchlist, 'followedRegions' | 'alerts'>;
  },
  remoteData: UserDataDocument | null,
): PersistableUserData {
  const mergedBookmarks = dedupeBookmarks([
    ...localState.bookmarks,
    ...(remoteData?.bookmarks ?? []),
  ]);

  const mergedFollowedTopics = sanitizeFollowedTopics([
    ...localState.preferences.followedTopics,
    ...(remoteData?.preferences.followedTopics ?? []),
    ...(remoteData?.watchlist.followedTopics ?? []),
  ]);

  const preferredLanguage =
    localState.preferences.preferredLanguage !== 'en'
      ? localState.preferences.preferredLanguage
      : (remoteData?.preferences.preferredLanguage ??
        localState.preferences.preferredLanguage);

  const mergedRecentSearches = sortAndLimitRecentSearches([
    ...localState.preferences.recentSearches,
    ...(remoteData?.recentSearches ?? []),
  ]);
  const mergedSavedLocations = dedupeSavedLocations([
    ...localState.savedLocations,
    ...(remoteData?.savedLocations ?? []),
  ]);
  const mergedFollowedRegions = dedupeFollowedRegions([
    ...localState.watchlist.followedRegions,
    ...(remoteData?.watchlist.followedRegions ?? []),
  ]);
  const mergedAlerts = sanitizeAlerts(
    [
      ...localState.watchlist.alerts,
      ...(remoteData?.watchlist.alerts ?? []),
    ],
    mergedFollowedRegions,
  );

  const now = new Date().toISOString();
  const createdAt = remoteData?.profile.createdAt ?? now;

  return {
    profile: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt,
      lastLoginAt: now,
    },
    bookmarks: mergedBookmarks,
    savedLocations: mergedSavedLocations,
    preferences: {
      preferredLanguage,
      followedTopics: mergedFollowedTopics,
    },
    watchlist: {
      followedTopics: mergedFollowedTopics,
      followedRegions: mergedFollowedRegions,
      alerts: mergedAlerts,
    },
    recentSearches: mergedRecentSearches,
  };
}

export async function saveUserData(
  uid: string,
  payload: PersistableUserData,
): Promise<SavedUserDataSnapshot> {
  const normalizedTopics = sanitizeFollowedTopics([
    ...payload.preferences.followedTopics,
    ...payload.watchlist.followedTopics,
  ]);
  const followedRegions = dedupeFollowedRegions(payload.watchlist.followedRegions);

  const persisted: SavedUserDataSnapshot = {
    profile: payload.profile,
    bookmarks: dedupeBookmarks(payload.bookmarks),
    savedLocations: dedupeSavedLocations(payload.savedLocations),
    preferences: {
      preferredLanguage: payload.preferences.preferredLanguage,
      followedTopics: normalizedTopics,
    },
    watchlist: {
      followedTopics: normalizedTopics,
      followedRegions,
      alerts: sanitizeAlerts(payload.watchlist.alerts, followedRegions),
    },
    recentSearches: sortAndLimitRecentSearches(payload.recentSearches),
    updatedAt: new Date().toISOString(),
  };

  await persistUserDataWithRetry(uid, persisted);

  return persisted;
}
