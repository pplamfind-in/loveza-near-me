'use client';

import type { NearbyStore } from 'src/types/store';

import { useQuery } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect } from 'react';

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

import { formatRadiusM } from 'src/lib/admin/duplicate-radius';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

import { NearbyMap } from './nearby-map';
import { getNearbyStoreColor } from './nearby-colors';

type SortedNearbyStore = NearbyStore & { distanceKm: number };
type NearbySearchResult = { stores: SortedNearbyStore[]; radiusM: number };

const EMPTY_STORES: SortedNearbyStore[] = [];
const LOCATION_PERMISSION_KEY = 'loveza_location_allowed_v1';
const LOCATION_RETRY_AFTER_RELOAD_KEY = 'loveza_location_retry_after_reload_v1';
const LOCATION_SESSION_CACHE_KEY = 'loveza_location_session_v1';
const LOCATION_SESSION_MAX_AGE_MS = 10 * 60 * 1000;
const STORES_PAGE_SIZE = 3;
const LOAD_MORE_DELAY_MS = 300;

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
  const {
    coordinates,
    isLoading: locating,
    error: gpsError,
    requestLocation,
    restoreLocation,
  } = useGeolocation();
  const permissionCheckedRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleStoreCount, setVisibleStoreCount] = useState(STORES_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const locationSettingsSteps = useMemo(() => {
    if (typeof navigator === 'undefined') return [];

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isChrome = /CriOS|Chrome/.test(userAgent);

    if (isIOS && isChrome) {
      return [
        'เปิดการตั้งค่าของ iPhone → แอป → Chrome',
        'แตะตำแหน่งที่ตั้ง → เลือกขณะใช้แอป และเปิดตำแหน่งที่ตั้งจริง',
        'กลับมาหน้านี้ แล้วกดขอพิกัดอีกครั้ง',
      ];
    }

    if (isIOS) {
      return [
        'เปิดการตั้งค่า → ความเป็นส่วนตัวและความปลอดภัย → บริการหาตำแหน่งที่ตั้ง → เว็บไซต์ Safari → เลือกขณะใช้แอป และเปิดตำแหน่งที่ตั้งจริง',
        'กลับมาที่ Safari กดไอคอนเมนูด้านซ้ายของ URL → ปุ่ม … → การตั้งค่าเว็บไซต์ → ตำแหน่งที่ตั้ง → เลือกอนุญาต',
        'ถ้าเปิดทั้ง 2 จุดแล้วยังไม่ได้: ไปที่ การตั้งค่า → แอป → Safari → ขั้นสูง → ข้อมูลเว็บไซต์ → ค้นหา loveza-near-me.vercel.app แล้วลบเฉพาะเว็บไซต์นี้',
        'กลับมาหน้านี้ แล้วกดรีโหลดเพื่อให้ Safari ขอสิทธิ์ใหม่',
      ];
    }

    return [
      'กดไอคอนด้านซ้ายของ URL → สิทธิ์ของเว็บไซต์',
      'แตะตำแหน่งที่ตั้ง → เลือกอนุญาต',
      'กลับมาหน้านี้ แล้วกดขอพิกัดอีกครั้ง',
    ];
  }, []);

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
      try {
        const cachedValue = sessionStorage.getItem(LOCATION_SESSION_CACHE_KEY);
        if (cachedValue) {
          const cachedLocation = JSON.parse(cachedValue) as {
            coordinates: { latitude: number; longitude: number };
            savedAt: number;
          };
          const isFresh = Date.now() - cachedLocation.savedAt <= LOCATION_SESSION_MAX_AGE_MS;
          const isValid =
            Number.isFinite(cachedLocation.coordinates.latitude) &&
            Number.isFinite(cachedLocation.coordinates.longitude);

          if (isFresh && isValid) {
            restoreLocation(cachedLocation.coordinates);
            setLocationDialogOpen(false);
            return;
          }
          sessionStorage.removeItem(LOCATION_SESSION_CACHE_KEY);
        }
      } catch {
        sessionStorage.removeItem(LOCATION_SESSION_CACHE_KEY);
      }

      const shouldRetryAfterReload =
        sessionStorage.getItem(LOCATION_RETRY_AFTER_RELOAD_KEY) === 'true';
      sessionStorage.removeItem(LOCATION_RETRY_AFTER_RELOAD_KEY);

      if (!window.isSecureContext) {
        setLocationDialogOpen(true);
        return;
      }

      if (!navigator.permissions?.query) {
        if (wasPreviouslyAllowed || shouldRetryAfterReload) requestLocation();
        else setLocationDialogOpen(true);
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (!active) return;
        permissionStatus.addEventListener('change', handlePermissionState);

        // หลังรีเซ็ตข้อมูลเว็บไซต์ Safari จะกลับมาเป็น "ถาม" จึงต้องขอสิทธิ์ใหม่อีกครั้ง
        if (permissionStatus.state === 'prompt' && shouldRetryAfterReload) {
          requestLocation();
          return;
        }
        handlePermissionState();
      } catch {
        if (wasPreviouslyAllowed || shouldRetryAfterReload) requestLocation();
        else setLocationDialogOpen(true);
      }
    };

    void checkPermission();

    return () => {
      active = false;
      permissionStatus?.removeEventListener('change', handlePermissionState);
    };
  }, [requestLocation, restoreLocation]);

  useEffect(() => {
    if (!coordinates) return;
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    sessionStorage.setItem(
      LOCATION_SESSION_CACHE_KEY,
      JSON.stringify({ coordinates, savedAt: Date.now() })
    );
    setLocationDialogOpen(false);
  }, [coordinates]);

  useEffect(() => {
    if (!gpsError) return;
    localStorage.removeItem(LOCATION_PERMISSION_KEY);
    sessionStorage.removeItem(LOCATION_SESSION_CACHE_KEY);
    setLocationDialogOpen(true);
  }, [gpsError]);

  const handleRequestLocation = () => {
    if (gpsError) {
      sessionStorage.setItem(LOCATION_RETRY_AFTER_RELOAD_KEY, 'true');
      window.location.reload();
      return;
    }

    setLocationDialogOpen(false);
    requestLocation();
  };

  const { data, isFetching, isError, dataUpdatedAt } = useQuery({
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
  const visibleStores = stores.slice(0, visibleStoreCount);
  const hasMoreStores = visibleStoreCount < stores.length;
  const searchRadiusM = data?.radiusM ?? null;
  const loading = locating || isFetching;
  const message = isError
    ? 'ค้นหาร้านไม่สำเร็จ กรุณาลองอีกครั้ง'
    : !loading && coordinates && stores.length === 0
      ? `ยังไม่พบร้านในระยะ ${searchRadiusM ? formatRadiusM(searchRadiusM) : 'ที่ Admin กำหนด'} ช่วยแจ้งพิกัดแรกได้เลย`
      : '';

  useEffect(() => {
    setVisibleStoreCount(STORES_PAGE_SIZE);
    setIsLoadingMore(false);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMoreStores) return undefined;

    let loadMoreTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        setIsLoadingMore(true);
        loadMoreTimer = window.setTimeout(() => {
          setVisibleStoreCount((current) => Math.min(current + STORES_PAGE_SIZE, stores.length));
          setIsLoadingMore(false);
        }, LOAD_MORE_DELAY_MS);
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (loadMoreTimer) window.clearTimeout(loadMoreTimer);
    };
  }, [hasMoreStores, stores.length, visibleStoreCount]);

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
                    {searchRadiusM && `ระยะค้นหา ${formatRadiusM(searchRadiusM)}`}
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${stores.length} ร้าน`}
              sx={{ color: '#fff', fontWeight: 900, bgcolor: '#7b43a1' }}
            />
          </Stack>
        </Stack>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {visibleStores.map((store, index) => {
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
                    {store.store_type_logo_url ? (
                      <Box
                        component="span"
                        sx={{
                          width: 36,
                          height: 36,
                          p: '4px',
                          display: 'grid',
                          overflow: 'hidden',
                          borderRadius: '50%',
                          placeItems: 'center',
                          bgcolor: '#fff',
                        }}
                      >
                        <Box
                          component="img"
                          src={store.store_type_logo_url}
                          alt={`Logo ${store.name}`}
                          sx={{ width: 1, height: 1, objectFit: 'contain' }}
                        />
                      </Box>
                    ) : (
                      <Iconify icon="ri:store-2-fill" width={23} />
                    )}
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
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {store.last_reported_at
                      ? `พบล่าสุด ${formatRelativeTimeTh(store.last_reported_at)}`
                      : 'ยังไม่มีเวลารายงานล่าสุด'}
                  </Typography>
                  <Typography
                    sx={{
                      gap: 0.5,
                      display: 'flex',
                      color: storeColor.dark,
                      alignItems: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    <Iconify icon="ri:user-heart-fill" width={15} />
                    แจ้งโดย {store.reporter_display_name ?? 'นักล่า Loveza'}
                  </Typography>
                </Stack>
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
      {hasMoreStores ? (
        <Stack
          ref={loadMoreRef}
          role="status"
          aria-live="polite"
          spacing={1}
          alignItems="center"
          sx={{ minHeight: 88, pt: 2, pb: 1, color: '#7b43a1' }}
        >
          {isLoadingMore ? (
            <CircularProgress size={28} color="inherit" />
          ) : (
            <Iconify icon="ri:arrow-down-double-line" width={28} />
          )}
          <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
            {isLoadingMore ? 'กำลังโหลดร้านเพิ่มเติม...' : 'เลื่อนลงเพื่อดูร้านเพิ่มเติม'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            แสดงแล้ว {visibleStores.length} จาก {stores.length} ร้าน
          </Typography>
        </Stack>
      ) : stores.length > STORES_PAGE_SIZE ? (
        <Typography
          role="status"
          sx={{ py: 2, color: 'text.secondary', textAlign: 'center', fontSize: 13, fontWeight: 800 }}
        >
          แสดงครบทั้งหมด {stores.length} ร้านแล้ว
        </Typography>
      ) : null}

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
          {gpsError ? 'เปิดสิทธิ์ตำแหน่งที่ตั้งก่อน' : 'เปิดตำแหน่งที่ตั้งก่อนออกล่า'}
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
            <Stack spacing={1.1} sx={{ mt: 1.25 }}>
              {locationSettingsSteps.map((step, index) => (
                <Stack key={step} direction="row" spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      display: 'grid',
                      flexShrink: 0,
                      borderRadius: '50%',
                      placeItems: 'center',
                      color: '#fff',
                      bgcolor: '#E5007E',
                      fontSize: 11,
                      fontWeight: 1000,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography sx={{ color: '#5B3A50', fontSize: 12, lineHeight: 1.6 }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {gpsError?.includes('HTTPS') ? (
              <Typography sx={{ mt: 1.25, color: '#7A5D72', fontSize: 11, lineHeight: 1.55 }}>
                ต้องเปิดเว็บไซต์ผ่าน HTTPS การทดสอบด้วย IP แบบ http://192.168.x.x
                จะไม่สามารถขอตำแหน่งได้
              </Typography>
            ) : null}
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
            {gpsError ? 'รีโหลดหน้าและขอพิกัดใหม่' : 'เปิดตำแหน่ง'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
