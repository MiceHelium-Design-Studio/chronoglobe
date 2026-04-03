import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, Marker } from '../../types/map';

const initialState: MapState = {
  center: [51.505, -0.09],
  zoom: 3,
  markers: [],
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    hydrateMarkers: (state, action: PayloadAction<Marker[]>) => {
      state.markers = action.payload;
    },
    setCenter: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    addMarker: (state, action: PayloadAction<Omit<Marker, 'id'>>) => {
      const marker: Marker = { ...action.payload, id: crypto.randomUUID() };
      state.markers.push(marker);
    },
    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter((m) => m.id !== action.payload);
    },
    clearMarkers: (state) => {
      state.markers = [];
    },
  },
});

export const {
  hydrateMarkers,
  setCenter,
  setZoom,
  addMarker,
  removeMarker,
  clearMarkers,
} = mapSlice.actions;
export default mapSlice.reducer;
