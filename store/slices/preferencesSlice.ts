import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  PreferencesState,
  RecentSearch,
  SupportedCategory,
} from '../../types/preferences';

const initialState: PreferencesState = {
  followedTopics: ['technology', 'business'],
  recentSearches: [],
  preferredLanguage: 'en',
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    toggleFollowedTopic: (state, action: PayloadAction<SupportedCategory>) => {
      const topic = action.payload;

      if (state.followedTopics.includes(topic)) {
        state.followedTopics = state.followedTopics.filter((item) => item !== topic);
      } else {
        state.followedTopics.push(topic);
      }
    },
    addRecentSearch: (state, action: PayloadAction<Omit<RecentSearch, 'id'>>) => {
      const next: RecentSearch = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...action.payload,
      };

      const deduped = state.recentSearches.filter(
        (item) =>
          !(
            item.query === next.query &&
            item.category === next.category
          ),
      );

      state.recentSearches = [next, ...deduped].slice(0, 15);
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    setPreferredLanguage: (state, action: PayloadAction<string>) => {
      state.preferredLanguage = action.payload;
    },
    hydratePreferences: (state, action: PayloadAction<PreferencesState>) => {
      state.followedTopics = action.payload.followedTopics;
      state.recentSearches = action.payload.recentSearches;
      state.preferredLanguage = action.payload.preferredLanguage;
    },
  },
});

export const {
  toggleFollowedTopic,
  addRecentSearch,
  clearRecentSearches,
  setPreferredLanguage,
  hydratePreferences,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
