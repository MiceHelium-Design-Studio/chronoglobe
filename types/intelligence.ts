import { TimelineMarker, TimelineRegion } from './history';

export type IntelligenceMode = 'historical' | 'live' | 'compare';

export interface IntelligenceMarker {
  id: string;
  label: string;
  mode: IntelligenceMode;
  lat: number;
  lng: number;
  intensity: 'high' | 'medium' | 'low';
}

export interface IntelligenceMapLayer {
  mode: IntelligenceMode;
  markers: TimelineMarker[] | IntelligenceMarker[];
  regions: TimelineRegion[];
  legendTitle: string;
}
