export interface MapState {
  center: [number, number];
  zoom: number;
  markers: SavedLocation[];
}

export interface SavedLocation {
  lat: number;
  lng: number;
  title: string;
  id: string;
}

export type Marker = SavedLocation;
