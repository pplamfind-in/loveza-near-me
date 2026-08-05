'use client';

import type { Coordinates } from 'src/utils/calculate-distance';

import { useRef, useState, useEffect, useCallback } from 'react';

// ----------------------------------------------------------------------

type GeolocationState = {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
};

const GEOLOCATION_TIMEOUT_MS = 10000;
const GEOLOCATION_MAX_AGE_MS = 60000;

function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'คุณไม่ได้อนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์เข้าถึงตำแหน่งแล้วลองใหม่';
    case error.POSITION_UNAVAILABLE:
      return 'ไม่สามารถอ่านตำแหน่งของคุณได้ในขณะนี้';
    case error.TIMEOUT:
      return 'ค้นหาตำแหน่งใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
    default:
      return 'เกิดข้อผิดพลาดในการระบุตำแหน่ง กรุณาลองใหม่อีกครั้ง';
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    isLoading: false,
    error: null,
  });
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({
        coordinates: null,
        isLoading: false,
        error: 'เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง',
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        if (!isMountedRef.current) return;
        setState({ coordinates: null, isLoading: false, error: getErrorMessage(error) });
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
      }
    );
  }, []);

  return { ...state, requestLocation };
}
