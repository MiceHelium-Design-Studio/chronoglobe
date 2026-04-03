import { NewsArticle } from '../types/news';
import { Marker } from '../types/map';
import {
  CATEGORY_OPTIONS,
  PreferencesState,
  RecentSearch,
  SupportedCategory,
} from '../types/preferences';
import {
  AlertRule,
  FollowedRegion,
  PersistedWatchlist,
} from '../types/watchlist';

const PREFERENCES_KEY = 'atlaswire.preferences.v1';
const BOOKMARKS_KEY = 'atlaswire.bookmarks.v1';
const MAP_MARKERS_KEY = 'atlaswire.map-markers.v1';
const WATCHLIST_KEY = 'atlaswire.watchlist.v1';
const categorySet = new Set<SupportedCategory>(CATEGORY_OPTIONS);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseJson(raw: string | null): unknown {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (!isObject(value)) {
    return false;
  }

  const category =
    typeof value.category === 'string'
      ? categorySet.has(value.category as SupportedCategory)
      : value.category === undefined;

  return (
    typeof value.id === 'string' &&
    typeof value.query === 'string' &&
    typeof value.createdAt === 'string' &&
    category
  );
}

function isArticle(value: unknown): value is NewsArticle {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.url === 'string' &&
    typeof value.title === 'string' &&
    isObject(value.source) &&
    typeof value.source.name === 'string'
  );
}

function isMarker(value: unknown): value is Marker {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.lat === 'number' &&
    Number.isFinite(value.lat) &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lng)
  );
}

function isFollowedRegion(value: unknown): value is FollowedRegion {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.lat === 'number' &&
    Number.isFinite(value.lat) &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lng) &&
    typeof value.radiusKm === 'number' &&
    Number.isFinite(value.radiusKm) &&
    (typeof value.sourceLocationId === 'string' || value.sourceLocationId === null) &&
    typeof value.createdAt === 'string'
  );
}

function isAlertRule(value: unknown): value is AlertRule {
  if (!isObject(value)) {
    return false;
  }

  const hasTopic =
    value.topic === null ||
    (typeof value.topic === 'string' &&
      categorySet.has(value.topic as SupportedCategory));

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    hasTopic &&
    (typeof value.regionId === 'string' || value.regionId === null) &&
    typeof value.enabled === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function loadLocalBookmarks(): NewsArticle[] {
  const parsed = parseJson(localStorage.getItem(BOOKMARKS_KEY));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isArticle);
}

export function saveLocalBookmarks(bookmarks: NewsArticle[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function loadLocalPreferences(
  fallback: PreferencesState,
): PreferencesState {
  const parsed = parseJson(localStorage.getItem(PREFERENCES_KEY));

  if (!isObject(parsed)) {
    return fallback;
  }

  return {
    preferredLanguage:
      typeof parsed.preferredLanguage === 'string'
        ? parsed.preferredLanguage
        : fallback.preferredLanguage,
    followedTopics: Array.isArray(parsed.followedTopics)
      ? parsed.followedTopics.filter(
          (topic): topic is PreferencesState['followedTopics'][number] =>
            typeof topic === 'string' &&
            categorySet.has(topic as SupportedCategory),
        )
      : fallback.followedTopics,
    recentSearches: Array.isArray(parsed.recentSearches)
      ? parsed.recentSearches.filter(isRecentSearch)
      : fallback.recentSearches,
  };
}

export function saveLocalPreferences(preferences: PreferencesState): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function loadLocalMarkers(): Marker[] {
  const parsed = parseJson(localStorage.getItem(MAP_MARKERS_KEY));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isMarker);
}

export function saveLocalMarkers(markers: Marker[]): void {
  localStorage.setItem(MAP_MARKERS_KEY, JSON.stringify(markers));
}

export function loadLocalWatchlist(
  fallbackTopics: SupportedCategory[],
): PersistedWatchlist {
  const parsed = parseJson(localStorage.getItem(WATCHLIST_KEY));

  if (!isObject(parsed)) {
    return {
      followedTopics: fallbackTopics,
      followedRegions: [],
      alerts: [],
    };
  }

  return {
    followedTopics: Array.isArray(parsed.followedTopics)
      ? parsed.followedTopics.filter(
          (topic): topic is SupportedCategory =>
            typeof topic === 'string' &&
            categorySet.has(topic as SupportedCategory),
        )
      : fallbackTopics,
    followedRegions: Array.isArray(parsed.followedRegions)
      ? parsed.followedRegions.filter(isFollowedRegion)
      : [],
    alerts: Array.isArray(parsed.alerts) ? parsed.alerts.filter(isAlertRule) : [],
  };
}

export function saveLocalWatchlist(watchlist: PersistedWatchlist): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}
