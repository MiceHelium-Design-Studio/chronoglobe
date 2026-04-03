import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import newsReducer from './slices/newsSlice';
import authReducer from './slices/authSlice';
import mapReducer from './slices/mapSlice';
import bookmarkReducer from './slices/bookmarkSlice';
import preferencesReducer from './slices/preferencesSlice';
import syncReducer from './slices/syncSlice';
import watchlistReducer from './slices/watchlistSlice';

export const store = configureStore({
  reducer: {
    news: newsReducer,
    auth: authReducer,
    map: mapReducer,
    bookmarks: bookmarkReducer,
    preferences: preferencesReducer,
    sync: syncReducer,
    watchlist: watchlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
