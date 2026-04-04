'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { addMarker, removeMarker } from '../../store/slices/mapSlice';
import { UpgradePrompt } from '../entitlements/UpgradePrompt';
import { useEntitlements } from '../../hooks/useEntitlements';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Marker as MarkerType } from '../../types/map';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapControllerProps {
  onSavedLocationLimitReached: () => void;
  canAddSavedLocation: (currentCount: number) => boolean;
}

function MapController({
  onSavedLocationLimitReached,
  canAddSavedLocation,
}: MapControllerProps) {
  const map = useMap();
  const { center, zoom, markers } = useAppSelector((state) => state.map);
  const dispatch = useAppDispatch();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  useEffect(() => {
    const handleClick = (event: L.LeafletMouseEvent) => {
      if (!canAddSavedLocation(markers.length)) {
        onSavedLocationLimitReached();
        return;
      }

      dispatch(
        addMarker({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
          title: 'Pinned location',
        }),
      );
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [canAddSavedLocation, dispatch, map, markers.length, onSavedLocationLimitReached]);

  return null;
}

interface MapProps {
  className?: string;
}

export default function Map({ className }: MapProps) {
  const { markers, center, zoom } = useAppSelector((state) => state.map);
  const dispatch = useAppDispatch();
  const [limitReached, setLimitReached] = useState(false);
  const { plan, entitlements, canAddSavedLocation } = useEntitlements();
  const { track } = useAnalytics();

  if (!center || typeof zoom !== 'number') {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
        Map is not available right now.
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {limitReached && (
        <div className="absolute left-3 right-3 top-3 z-[500]">
          <UpgradePrompt
            title="Saved location limit reached"
            description={`Your current plan supports up to ${entitlements.maxSavedLocations} saved locations.`}
            targetPlan={plan === 'free' ? 'pro' : 'team'}
            compact
          />
        </div>
      )}
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapController
          canAddSavedLocation={canAddSavedLocation}
          onSavedLocationLimitReached={() => {
            setLimitReached(true);
            track('upgrade_cta_click', {
              plan: 'pro',
              location: 'map_gate',
            });
          }}
        />
        {markers.map((marker: MarkerType) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="space-y-2">
                <p className="text-sm font-medium">{marker.title}</p>
                <button
                  onClick={() => dispatch(removeMarker(marker.id))}
                  className="text-xs text-red-600"
                >
                  Remove pin
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
