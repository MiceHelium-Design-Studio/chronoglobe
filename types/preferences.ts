export type SupportedCategory =
  | 'business'
  | 'entertainment'
  | 'general'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology';

export const CATEGORY_OPTIONS: SupportedCategory[] = [
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology',
];

export interface RecentSearch {
  id: string;
  query: string;
  category?: SupportedCategory;
  createdAt: string;
}

export interface PreferencesState {
  followedTopics: SupportedCategory[];
  recentSearches: RecentSearch[];
  preferredLanguage: string;
}
