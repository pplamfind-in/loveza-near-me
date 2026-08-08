import type { Coordinates } from 'src/types/store';

// ----------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers.
 * @example
 * calculateDistanceKm({ latitude: 13.75, longitude: 100.5 }, { latitude: 13.76, longitude: 100.51 }) // 1.4
 */
export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} กม.`;
}
