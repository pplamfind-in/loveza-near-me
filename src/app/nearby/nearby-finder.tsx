'use client';

import type { NearbyStore } from 'src/types/store';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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

import { formatDuplicateRadius } from 'src/lib/admin/duplicate-radius';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

import { NearbyMap } from './nearby-map';
import { getNearbyStoreColor } from './nearby-colors';

type SortedNearbyStore = NearbyStore & { distanceKm: number };
type NearbySearchResult = { stores: SortedNearbyStore[]; radiusM: number };

const EMPTY_STORES: SortedNearbyStore[] = [];

const locateButtonSx = {
  minHeight: 52,
  color: '#351129',
  border: '2px solid #351129',
  borderRadius: 99,
  bgcolor: '#FDE047',
  backgroundImage: 'none',
  boxShadow: '4px 5px 0 #351129',
  '&:hover': {
    bgcolor: '#FFE96B',
    backgroundImage: 'none',
    boxShadow: '2px 3px 0 #351129',
  },
} as const;

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function NearbyFinder() {
  const { coordinates, isLoading: locating, error: gpsError, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['nearby-stores', coordinates?.latitude, coordinates?.longitude],
    enabled: !!coordinates,
    queryFn: async (): Promise<NearbySearchResult> => {
      const response = await fetch(
        `/api/stores/nearby?lat=${coordinates!.latitude}&lng=${coordinates!.longitude}`
      );
      if (!response.ok) throw new Error('request failed');

      const payload = (await response.json()) as { stores: NearbyStore[]; radiusM: number };
      return {
        radiusM: payload.radiusM,
        stores: payload.stores
          .map((store) => ({
            ...store,
            distanceKm: calculateDistanceKm(coordinates!, {
              latitude: store.latitude,
              longitude: store.longitude,
            }),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm),
      };
    },
  });

  const stores = data?.stores ?? EMPTY_STORES;
  const searchRadiusM = data?.radiusM ?? null;
  const loading = locating || isFetching;
  const message = isError
    ? 'ค้นหาร้านไม่สำเร็จ กรุณาลองอีกครั้ง'
    : !loading && coordinates && stores.length === 0
      ? `ยังไม่พบร้านในระยะ ${searchRadiusM ? formatDuplicateRadius(searchRadiusM) : 'ที่ Admin กำหนด'} ช่วยแจ้งพิกัดแรกได้เลย`
      : '';

  return (
    <Stack spacing={2}>
      {!coordinates ? (
        <Button
          onClick={requestLocation}
          disabled={loading}
          variant="contained"
          size="large"
          startIcon={!loading ? <Iconify icon="ri:focus-3-line" /> : undefined}
          sx={locateButtonSx}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'ลองใช้ตำแหน่งของฉันอีกครั้ง'}
        </Button>
      ) : null}
      {gpsError ? (
        <Alert severity="warning" sx={{ whiteSpace: 'pre-line' }}>
          {gpsError}
        </Alert>
      ) : null}
      {coordinates ? (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '2px solid #351129',
              borderRadius: 3,
              bgcolor: '#DDFBF7',
              boxShadow: '4px 5px 0 #351129',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Iconify icon="ri:map-pin-user-fill" width={28} sx={{ color: '#1687ff' }} />
                <div>
                  <Typography sx={{ fontWeight: 900 }}>
                    ตำแหน่งปัจจุบันของคุณ -{' '}
                    {searchRadiusM && `ระยะค้นหา ${formatDuplicateRadius(searchRadiusM)}`}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </Typography>
                </div>
              </Stack>
              <Button
                onClick={requestLocation}
                disabled={loading}
                variant="contained"
                size="large"
                startIcon={!loading ? <Iconify icon="ri:focus-3-line" /> : undefined}
                sx={locateButtonSx}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : coordinates ? (
                  'อัปเดตตำแหน่งปัจจุบัน'
                ) : (
                  'ค้นหาใกล้ฉัน'
                )}
              </Button>
            </Stack>
          </Paper>
          <NearbyMap coordinates={coordinates} stores={stores} />
        </>
      ) : null}
      {message ? <Alert severity="info">{message}</Alert> : null}
      {stores.length ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2 }}>
          <div>
            <Typography sx={{ color: '#572676', fontSize: { xs: 22, md: 28 }, fontWeight: 1000 }}>
              ร้าน Loveza ใกล้คุณ
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              เรียงจากร้านที่อยู่ใกล้ที่สุด
            </Typography>
          </div>
          <Chip
            label={`${stores.length} ร้าน`}
            sx={{ color: '#fff', fontWeight: 900, bgcolor: '#7b43a1' }}
          />
        </Stack>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        {stores.map((store, index) => {
          const storeColor = getNearbyStoreColor(store.id);

          return (
            <Paper
              key={store.id}
              elevation={0}
              sx={{
                p: 2.5,
                overflow: 'hidden',
                position: 'relative',
                border: '3px solid #351129',
                borderRadius: 3.5,
                background: `linear-gradient(135deg, #fff 46%, ${storeColor.soft} 100%)`,
                boxShadow: '5px 6px 0 #351129',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&::before': {
                  content: '""',
                  top: 0,
                  left: 0,
                  width: 1,
                  height: 5,
                  position: 'absolute',
                  background: `linear-gradient(90deg, ${storeColor.main}, ${storeColor.dark})`,
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '3px 4px 0 #351129',
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      color: '#fff',
                      display: 'grid',
                      flexShrink: 0,
                      borderRadius: 2.25,
                      placeItems: 'center',
                      border: '2px solid #351129',
                      bgcolor: storeColor.main,
                      boxShadow: '3px 3px 0 #351129',
                    }}
                  >
                    <Iconify icon="ri:store-2-fill" width={23} />
                  </Box>
                  <div>
                    <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>{store.name}</Typography>
                    <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                      {[store.address, store.province].filter(Boolean).join(', ')}
                    </Typography>
                  </div>
                </Stack>
                <Typography sx={{ color: storeColor.dark, fontWeight: 1000, whiteSpace: 'nowrap' }}>
                  #{index + 1}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1.75, borderColor: `${storeColor.main}24` }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={STORE_STATUS_LABEL[store.current_status] ?? STORE_STATUS_LABEL.unknown}
                  sx={{ color: storeColor.dark, fontWeight: 900, bgcolor: storeColor.soft }}
                />
                <Chip
                  size="small"
                  icon={<Iconify icon="ri:map-pin-distance-fill" />}
                  label={`${store.distanceKm.toFixed(1)} กม.`}
                  sx={{ fontWeight: 800, bgcolor: '#fff' }}
                />
                {store.estimated_quantity !== null ? (
                  <Chip
                    size="small"
                    icon={<Iconify icon="ri:drinks-2-fill" />}
                    label={`ประมาณ ${store.estimated_quantity} กระป๋อง`}
                    sx={{ fontWeight: 800, bgcolor: '#fff' }}
                  />
                ) : null}
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
                sx={{ mt: 2 }}
              >
                <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                  {store.last_reported_at
                    ? `พบล่าสุด ${formatRelativeTimeTh(store.last_reported_at)}`
                    : 'ยังไม่มีเวลารายงานล่าสุด'}
                </Typography>
                <Button
                  component="a"
                  href={buildGoogleMapsUrl(store.latitude, store.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="ri:route-fill" />}
                  sx={{
                    color: '#fff',
                    flexShrink: 0,
                    border: '2px solid #351129',
                    borderRadius: 99,
                    bgcolor: storeColor.main,
                    boxShadow: '3px 3px 0 #351129',
                    '&:hover': { bgcolor: storeColor.dark, boxShadow: '1px 2px 0 #351129' },
                  }}
                >
                  นำทาง
                </Button>
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}
