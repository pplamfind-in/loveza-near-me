'use client';

import type { NearbyStore } from 'src/types/store';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { calculateDistanceKm } from 'src/utils/geo';
import { formatRelativeTimeTh } from 'src/utils/relative-time-th';

import { STORE_STATUS_LABEL } from 'src/types/store';

type SortedStore = NearbyStore & { distanceKm: number };

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function NearbyFinder() {
  const { coordinates, isLoading: locating, error: gpsError, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const {
    data: stores = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['nearby-stores', coordinates?.latitude, coordinates?.longitude],
    enabled: !!coordinates,
    queryFn: async (): Promise<SortedStore[]> => {
      const response = await fetch(
        `/api/stores/nearby?lat=${coordinates!.latitude}&lng=${coordinates!.longitude}&radius=25`
      );
      if (!response.ok) throw new Error('request failed');

      const payload = (await response.json()) as { stores: NearbyStore[] };
      return payload.stores
        .map((store) => ({
          ...store,
          distanceKm: calculateDistanceKm(coordinates!, {
            latitude: store.latitude,
            longitude: store.longitude,
          }),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
  });

  const loading = locating || isFetching;
  const message = isError
    ? 'ค้นหาร้านไม่สำเร็จ กรุณาลองอีกครั้ง'
    : !loading && coordinates && stores.length === 0
      ? 'ยังไม่พบร้านในระยะ 25 กม. ช่วยแจ้งพิกัดแรกได้เลย'
      : '';

  return (
    <Stack spacing={2}>
      <Button
        onClick={requestLocation}
        disabled={loading}
        variant="contained"
        size="large"
        sx={{ borderRadius: 99 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'ค้นหาใกล้ฉัน'}
      </Button>
      {gpsError ? (
        <Alert severity="warning" sx={{ whiteSpace: 'pre-line' }}>
          {gpsError}
        </Alert>
      ) : null}
      {message ? <Alert severity="info">{message}</Alert> : null}
      {stores.map((store) => (
        <Paper key={store.id} elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <div>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{store.name}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                {[store.address, store.province].filter(Boolean).join(', ')}
              </Typography>
            </div>
            <Typography sx={{ color: '#ef2382', fontWeight: 900, whiteSpace: 'nowrap' }}>
              ห่างจากคุณ {store.distanceKm.toFixed(1)} กม.
            </Typography>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            rowGap={0.5}
          >
            <Typography sx={{ fontWeight: 700 }}>
              {STORE_STATUS_LABEL[store.current_status] ?? STORE_STATUS_LABEL.unknown}
              {store.estimated_quantity !== null ? ` · ประมาณ ${store.estimated_quantity} กระป๋อง` : ''}
            </Typography>
            {store.last_reported_at ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                พบล่าสุด {formatRelativeTimeTh(store.last_reported_at)}
              </Typography>
            ) : null}
          </Stack>
          <Button
            component="a"
            href={buildGoogleMapsUrl(store.latitude, store.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ mt: 1.5, px: 0 }}
          >
            เปิดใน Google Maps
          </Button>
        </Paper>
      ))}
    </Stack>
  );
}
