'use client';

import type { Coordinates } from 'src/types/store';

import { useRef, useState, useCallback } from 'react';

// ----------------------------------------------------------------------

export type UseGeolocationReturn = {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
};

const ERROR_MESSAGE = {
  unsupported: 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง (Geolocation)',
  permissionDenied: 'ไม่สามารถเข้าถึงตำแหน่งของคุณได้\nกรุณาอนุญาตตำแหน่ง หรือค้นหาจากพื้นที่แทน',
  timeout: 'ค้นหาตำแหน่งใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
  positionUnavailable: 'ไม่สามารถระบุตำแหน่งของคุณได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
  unknown: 'เกิดข้อผิดพลาดในการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง',
} as const;

/**
 * Wraps the browser Geolocation API. Every failure path (unsupported browser,
 * denied permission, timeout, unavailable position, or a synchronous throw in
 * insecure/unsupported contexts) resolves to a Thai error message instead of
 * throwing, so callers never need their own try/catch.
 */
export function useGeolocation(options?: PositionOptions): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(ERROR_MESSAGE.unsupported);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (positionError) => {
          setIsLoading(false);

          switch (positionError.code) {
            case positionError.PERMISSION_DENIED:
              setError(ERROR_MESSAGE.permissionDenied);
              break;
            case positionError.TIMEOUT:
              setError(ERROR_MESSAGE.timeout);
              break;
            case positionError.POSITION_UNAVAILABLE:
              setError(ERROR_MESSAGE.positionUnavailable);
              break;
            default:
              setError(ERROR_MESSAGE.unknown);
          }
        },
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0, ...optionsRef.current }
      );
    } catch {
      setIsLoading(false);
      setError(ERROR_MESSAGE.unknown);
    }
  }, []);

  return { coordinates, isLoading, error, requestLocation };
}
