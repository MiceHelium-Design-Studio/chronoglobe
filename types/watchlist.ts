import { SavedLocation } from './map';
import { SupportedCategory } from './preferences';

export interface FollowedRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  sourceLocationId: string | null;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  topic: SupportedCategory | null;
  regionId: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedWatchlist {
  followedTopics: SupportedCategory[];
  followedRegions: FollowedRegion[];
  alerts: AlertRule[];
}

export interface WatchlistState {
  followedRegions: FollowedRegion[];
  alerts: AlertRule[];
}

export type FollowRegionFromLocationInput = Pick<
  SavedLocation,
  'id' | 'title' | 'lat' | 'lng'
>;

export interface CreateAlertInput {
  name: string;
  topic: SupportedCategory | null;
  regionId: string | null;
}
