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
  insecureContext:
    'เบราว์เซอร์อนุญาตให้ใช้ตำแหน่งผ่าน HTTPS เท่านั้น กรุณาเปิดเว็บไซต์จาก URL แบบ HTTPS',
  permissionDenied:
    'ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาต Location ในการตั้งค่าเว็บไซต์ของเบราว์เซอร์ แล้วลองอีกครั้ง',
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
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError(ERROR_MESSAGE.insecureContext);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(ERROR_MESSAGE.unsupported);
      return;
    }

    setIsLoading(true);
    setError(null);

    const handleSuccess = (position: GeolocationPosition) => {
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setIsLoading(false);
      setError(null);
    };

    const handleFinalError = (positionError: GeolocationPositionError) => {
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
    };

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (positionError) => {
          if (positionError.code === positionError.PERMISSION_DENIED) {
            handleFinalError(positionError);
            return;
          }

          // GPS ความแม่นยำสูงอาจหาไม่เจอเมื่ออยู่ในอาคาร จึงลองตำแหน่งจากเครือข่ายอีกครั้ง
          navigator.geolocation.getCurrentPosition(handleSuccess, handleFinalError, {
            enableHighAccuracy: false,
            timeout: 20_000,
            maximumAge: 300_000,
            ...optionsRef.current,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
          ...optionsRef.current,
        }
      );
    } catch {
      setIsLoading(false);
      setError(ERROR_MESSAGE.unknown);
    }
  }, []);

  return { coordinates, isLoading, error, requestLocation };
}
