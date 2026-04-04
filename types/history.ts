import { IntelligenceMode } from './intelligence';

export interface TimelineMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  intensity: 'high' | 'medium' | 'low';
  note?: string;
}

export interface TimelineRegion {
  id: string;
  label: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  importance: 'high' | 'medium' | 'low';
}

export interface TimelineEvent {
  id: string;
  title: string;
  summary: string;
  region: string;
  tags: string[];
  significance: 'high' | 'medium' | 'low';
}

export type Era = {
  year: number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  eraLabel: string;
  tags: string[];
  summary: {
    dominantPowers: string[];
    conflicts: string[];
    population?: string;
    technologyLevel?: string;
    tradeContext?: string;
    culturalShift?: string;
  };
  map: {
    theme: string;
    imageUrl?: string;
    markers: TimelineMarker[];
    regions: TimelineRegion[];
    focus?: { lat: number; lng: number; zoom?: number };
  };
  events: TimelineEvent[];
  hotspots: string[];
};

export interface TimelineEngineState {
  mode: IntelligenceMode;
  selectedYear: number;
  selectedEra: Era;
}
