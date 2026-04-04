import { TimelineRegion } from '../../types/history';

export const seedRegionsByYear: Record<number, TimelineRegion[]> = {
  117: [
    { id: 'r117-med', label: 'Mediterranean Basin', centerLat: 35, centerLng: 18, radiusKm: 1700, importance: 'high' },
    { id: 'r117-indus', label: 'Indus Corridor', centerLat: 29, centerLng: 70, radiusKm: 900, importance: 'medium' },
  ],
  476: [
    { id: 'r476-west-europe', label: 'Western Europe', centerLat: 46, centerLng: 9, radiusKm: 1300, importance: 'high' },
  ],
  800: [
    { id: 'r800-francia', label: 'Francia', centerLat: 48, centerLng: 7, radiusKm: 1200, importance: 'high' },
    { id: 'r800-abbasid', label: 'Abbasid Core', centerLat: 33, centerLng: 44, radiusKm: 1000, importance: 'high' },
  ],
  1200: [
    { id: 'r1200-steppe', label: 'Eurasian Steppe', centerLat: 47, centerLng: 75, radiusKm: 2100, importance: 'high' },
  ],
  1453: [
    { id: 'r1453-eastern-med', label: 'Eastern Mediterranean', centerLat: 38, centerLng: 30, radiusKm: 900, importance: 'high' },
  ],
  1492: [
    { id: 'r1492-atlantic', label: 'Atlantic Routes', centerLat: 32, centerLng: -30, radiusKm: 2500, importance: 'high' },
  ],
  1812: [
    { id: 'r1812-europe', label: 'Continental Europe', centerLat: 50, centerLng: 14, radiusKm: 1600, importance: 'high' },
  ],
  1914: [
    { id: 'r1914-fronts', label: 'European Fronts', centerLat: 49, centerLng: 10, radiusKm: 1700, importance: 'high' },
  ],
  1945: [
    { id: 'r1945-postwar', label: 'Postwar Security Blocks', centerLat: 52, centerLng: 20, radiusKm: 2400, importance: 'high' },
  ],
  1991: [
    { id: 'r1991-eastern-europe', label: 'Eastern Europe Transition', centerLat: 53, centerLng: 27, radiusKm: 1200, importance: 'high' },
  ],
  2001: [
    { id: 'r2001-afpak', label: 'AfPak Theater', centerLat: 33, centerLng: 68, radiusKm: 900, importance: 'high' },
  ],
  2025: [
    { id: 'r2025-indopacific', label: 'Indo-Pacific Arc', centerLat: 13, centerLng: 114, radiusKm: 2800, importance: 'high' },
    { id: 'r2025-redsea', label: 'Red Sea Corridor', centerLat: 18, centerLng: 40, radiusKm: 900, importance: 'medium' },
  ],
};
