import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AlertRule,
  CreateAlertInput,
  FollowRegionFromLocationInput,
  FollowedRegion,
  PersistedWatchlist,
  WatchlistState,
} from '../../types/watchlist';

const DEFAULT_REGION_RADIUS_KM = 120;

const initialState: WatchlistState = {
  followedRegions: [],
  alerts: [],
};

function hasSameLocation(a: FollowedRegion, b: FollowRegionFromLocationInput): boolean {
  return (
    Math.abs(a.lat - b.lat) < 0.000001 &&
    Math.abs(a.lng - b.lng) < 0.000001 &&
    a.name.trim().toLowerCase() === b.title.trim().toLowerCase()
  );
}

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    hydrateWatchlist: (state, action: PayloadAction<PersistedWatchlist>) => {
      state.followedRegions = action.payload.followedRegions;
      state.alerts = action.payload.alerts;
    },
    followRegionFromLocation: (
      state,
      action: PayloadAction<FollowRegionFromLocationInput>,
    ) => {
      const location = action.payload;
      const existing = state.followedRegions.some(
        (region) =>
          region.sourceLocationId === location.id || hasSameLocation(region, location),
      );

      if (existing) {
        return;
      }

      state.followedRegions.unshift({
        id: crypto.randomUUID(),
        name: location.title.trim().length > 0 ? location.title : 'Tracked region',
        lat: location.lat,
        lng: location.lng,
        radiusKm: DEFAULT_REGION_RADIUS_KM,
        sourceLocationId: location.id,
        createdAt: new Date().toISOString(),
      });
    },
    unfollowRegion: (state, action: PayloadAction<string>) => {
      const regionId = action.payload;
      state.followedRegions = state.followedRegions.filter(
        (region) => region.id !== regionId,
      );
      state.alerts = state.alerts.map((alert) =>
        alert.regionId === regionId
          ? { ...alert, regionId: null, updatedAt: new Date().toISOString() }
          : alert,
      );
    },
    addAlert: (state, action: PayloadAction<CreateAlertInput>) => {
      const payload = action.payload;
      const now = new Date().toISOString();

      state.alerts.unshift({
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        topic: payload.topic,
        regionId: payload.regionId,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
    },
    toggleAlertEnabled: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((item) => item.id === action.payload);

      if (!alert) {
        return;
      }

      alert.enabled = !alert.enabled;
      alert.updatedAt = new Date().toISOString();
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
    },
    replaceAlerts: (state, action: PayloadAction<AlertRule[]>) => {
      state.alerts = action.payload;
    },
  },
});

export const {
  hydrateWatchlist,
  followRegionFromLocation,
  unfollowRegion,
  addAlert,
  toggleAlertEnabled,
  removeAlert,
  replaceAlerts,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
