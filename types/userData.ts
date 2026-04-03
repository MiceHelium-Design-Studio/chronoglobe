import { NewsArticle } from './news';
import { SavedLocation } from './map';
import { RecentSearch, SupportedCategory } from './preferences';
import { UserBilling } from './plans';
import { PersistedWatchlist } from './watchlist';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface PersistedPreferences {
  preferredLanguage: string;
  followedTopics: SupportedCategory[];
}

export interface UserDataDocument {
  version: 1;
  profile: UserProfile;
  billing: UserBilling;
  bookmarks: NewsArticle[];
  savedLocations: SavedLocation[];
  preferences: PersistedPreferences;
  watchlist: PersistedWatchlist;
  recentSearches: RecentSearch[];
  updatedAt: string;
}

export interface PersistableUserData {
  profile: UserProfile;
  bookmarks: NewsArticle[];
  savedLocations: SavedLocation[];
  preferences: PersistedPreferences;
  watchlist: PersistedWatchlist;
  recentSearches: RecentSearch[];
}

export interface SavedUserDataSnapshot extends PersistableUserData {
  updatedAt: string;
}
