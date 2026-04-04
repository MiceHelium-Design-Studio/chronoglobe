export interface HistoricalHotspot {
  id: string;
  label: string;
  region: string;
  x: number;
  y: number;
  intensity: 'high' | 'medium' | 'low';
  note: string;
}

export interface HistoricalTimelineEntry {
  id: string;
  year: number;
  displayYear: string;
  era: string;
  title: string;
  summary: string;
  keyEvents: string[];
  notableRegions: string[];
  dominantPowers: string[];
  turningPoint: string;
  culturalShift: string;
  tradeContext: string;
  mapTheme: 'antique' | 'imperial' | 'industrial' | 'modern';
  mapVariant: string;
  hotspots: HistoricalHotspot[];
}
