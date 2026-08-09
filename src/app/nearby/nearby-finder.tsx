'use client';

import type { NearbyStore } from 'src/types/store';

import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
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
const LOCATION_PERMISSION_KEY = 'loveza_location_allowed_v1';

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
  const permissionCheckedRef = useRef(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  useEffect(() => {
    if (permissionCheckedRef.current) return undefined;
    permissionCheckedRef.current = true;

    let active = true;
    let permissionStatus: PermissionStatus | undefined;
    const wasPreviouslyAllowed = localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';

    const handlePermissionState = () => {
      if (!active || !permissionStatus) return;

      if (permissionStatus.state === 'granted') {
        setLocationDialogOpen(false);
        requestLocation();
        return;
      }

      if (permissionStatus.state === 'denied') {
        localStorage.removeItem(LOCATION_PERMISSION_KEY);
      }
      setLocationDialogOpen(true);
    };

    const checkPermission = async () => {
      if (!window.isSecureContext) {
        setLocationDialogOpen(true);
        return;
      }

      if (!navigator.permissions?.query) {
        if (wasPreviouslyAllowed) requestLocation();
        else setLocationDialogOpen(true);
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (!active) return;
        permissionStatus.addEventListener('change', handlePermissionState);
        handlePermissionState();
      } catch {
        if (wasPreviouslyAllowed) requestLocation();
        else setLocationDialogOpen(true);
      }
    };

    void checkPermission();

    return () => {
      active = false;
      permissionStatus?.removeEventListener('change', handlePermissionState);
    };
  }, [requestLocation]);

  useEffect(() => {
    if (!coordinates) return;
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    setLocationDialogOpen(false);
  }, [coordinates]);

  useEffect(() => {
    if (!gpsError) return;
    localStorage.removeItem(LOCATION_PERMISSION_KEY);
    setLocationDialogOpen(true);
  }, [gpsError]);

  const handleRequestLocation = () => {
    setLocationDialogOpen(false);
    requestLocation();
  };

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
          onClick={() => setLocationDialogOpen(true)}
          disabled={loading}
          variant="contained"
          size="large"
          startIcon={!loading ? <Iconify icon="ri:focus-3-line" /> : undefined}
          sx={locateButtonSx}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'เปิดตำแหน่งเพื่อค้นหาร้านใกล้ฉัน'
          )}
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

      <Dialog
        open={locationDialogOpen && !coordinates}
        onClose={() => setLocationDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              m: 2,
              width: 'calc(100% - 32px)',
              maxWidth: 340,
              overflow: 'visible',
              border: '3px solid #351129',
              borderRadius: '28px',
              boxShadow: '8px 9px 0 #351129',
            },
          },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mt: -4,
            color: '#351129',
            display: 'grid',
            placeItems: 'center',
            border: '3px solid #351129',
            borderRadius: '20px',
            bgcolor: '#FDE047',
            boxShadow: '4px 4px 0 #351129',
            transform: 'rotate(-4deg)',
          }}
        >
          <Iconify icon="ri:map-pin-user-fill" width={32} />
        </Box>
        <DialogTitle
          sx={{
            pt: 2.5,
            pb: 1,
            px: 2,
            textAlign: 'center',
            fontSize: { xs: 23, sm: 26 },
            lineHeight: 1.25,
            fontWeight: 1000,
          }}
        >
          เปิด Location ก่อนออกล่า
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            Loveza Near Me จะใช้ตำแหน่งปัจจุบันเพื่อค้นหาร้านที่อยู่ใกล้คุณเท่านั้น
          </Typography>

          {gpsError ? (
            <Alert severity="warning" sx={{ mt: 2, textAlign: 'left', whiteSpace: 'pre-line' }}>
              {gpsError}
            </Alert>
          ) : null}

          <Box
            sx={{
              mt: 2,
              p: 2,
              textAlign: 'left',
              border: '2px solid #351129',
              borderRadius: '18px',
              bgcolor: '#DDFBF7',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 1000 }}>หากเคยกดไม่อนุญาต</Typography>
            <Typography sx={{ mt: 0.75, color: '#5B3A50', fontSize: 12, lineHeight: 1.65 }}>
              เปิดการตั้งค่าเว็บไซต์ใน Safari หรือ Chrome → Location → เลือก Allow
              แล้วกลับมากดใหม่อีกครั้ง
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, pb: 3, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}
        >
          <Button color="inherit" fullWidth onClick={() => setLocationDialogOpen(false)}>
            ไว้ก่อน
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleRequestLocation}
            startIcon={<Iconify icon="ri:focus-3-line" />}
            sx={locateButtonSx}
          >
            เปิดตำแหน่ง
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
