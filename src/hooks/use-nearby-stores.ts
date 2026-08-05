'use client';

import type { StoreWithDistance } from 'src/types/store';

import { useState, useEffect } from 'react';

import { calculateDistance } from 'src/utils/calculate-distance';

import { createClient } from 'src/lib/supabase/client';
import { getActiveStores } from 'src/services/stores.service';

import { useGeolocation } from './use-geolocation';

// ----------------------------------------------------------------------

export function useNearbyStores() {
  const geolocation = useGeolocation();
  const [stores, setStores] = useState<StoreWithDistance[] | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fallbackProvince, setFallbackProvince] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!geolocation.coordinates && !fallbackProvince) return undefined;

    let cancelled = false;

    async function load() {
      setIsLoadingStores(true);
      setFetchError(null);

      try {
        const supabase = createClient();
        const activeStores = await getActiveStores(
          supabase,
          fallbackProvince ? { province: fallbackProvince } : undefined
        );

        if (cancelled) return;

        const withDistance: StoreWithDistance[] = activeStores.map((store) => ({
          ...store,
          distanceKm: geolocation.coordinates
            ? calculateDistance(geolocation.coordinates, {
                latitude: store.latitude,
                longitude: store.longitude,
              })
            : null,
        }));

        withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

        setStores(withDistance);
      } catch (error) {
        if (!cancelled) {
          setFetchError(error instanceof Error ? error.message : 'โหลดข้อมูลร้านไม่สำเร็จ');
        }
      } finally {
        if (!cancelled) setIsLoadingStores(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [geolocation.coordinates, fallbackProvince, reloadKey]);

  return {
    stores,
    isLoading: geolocation.isLoading || isLoadingStores,
    error: fetchError,
    coordinates: geolocation.coordinates,
    geolocationError: geolocation.error,
    requestLocation: geolocation.requestLocation,
    fallbackProvince,
    setFallbackProvince,
    refetch: () => setReloadKey((key) => key + 1),
  };
}
