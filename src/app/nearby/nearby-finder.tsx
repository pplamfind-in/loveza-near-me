'use client';

import type { NearbyStore } from 'src/types/store';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { calculateDistanceKm } from 'src/utils/geo';
import { formatRelativeTimeTh } from 'src/utils/relative-time-th';

import { supabase } from 'src/lib/supabase';
import { formatRadiusM } from 'src/lib/admin/duplicate-radius';
import {
  getStockStatus,
  getStockQuantity,
  matchesMerchantStock,
  newestMerchantStockFirst,
  merchantConfirmationLabel,
} from 'src/lib/merchant-stock';

import { Iconify } from 'src/components/iconify';
import { MerchantStockFilter } from 'src/components/store-stock/merchant-stock-filter';

import { STORE_STATUS_LABEL } from 'src/types/store';
import { getMerchantFlavorStockLabels } from 'src/types/report';

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
  color: 'var(--palette-common-white)',
  border: '1px solid var(--palette-grey-300)',
  borderRadius: 99,
  bgcolor: 'var(--palette-primary-main)',
  backgroundImage: 'none',
  boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
  '&:hover': {
    bgcolor: 'var(--palette-primary-dark)',
    backgroundImage: 'none',
    boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
  },
} as const;

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function NearbyFinder() {
  const queryClient = useQueryClient();
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

  useEffect(() => {
    const channel = supabase
      .channel('nearby-stores-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['nearby-stores'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
        `ถ้าเปิดทั้ง 2 จุดแล้วยังไม่ได้: ไปที่ การตั้งค่า → แอป → Safari → ขั้นสูง → ข้อมูลเว็บไซต์ → ค้นหา ${window.location.hostname} แล้วลบเฉพาะเว็บไซต์นี้`,
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

  const [flavor, setFlavor] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const filteringStock = Boolean(flavor || availableOnly);
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

  const allStores = data?.stores ?? EMPTY_STORES;
  const stores = useMemo(
    () => filteringStock
      ? allStores.filter((store) => matchesMerchantStock(store, flavor, availableOnly))
          .sort((a, b) => newestMerchantStockFirst(a, b, flavor))
      : allStores,
    [allStores, filteringStock, flavor, availableOnly]
  );
  const visibleStores = stores.slice(0, visibleStoreCount);
  const hasMoreStores = visibleStoreCount < stores.length;
  const searchRadiusM = data?.radiusM ?? null;
  const loading = locating || isFetching;
  const message = isError
    ? 'ค้นหาร้านไม่สำเร็จ กรุณาลองอีกครั้ง'
    : !loading && coordinates && stores.length === 0
      ? filteringStock
        ? 'ยังไม่พบร้านที่ตรงกับตัวกรองในพื้นที่นี้'
        : `ยังไม่พบร้านในระยะ ${searchRadiusM ? formatRadiusM(searchRadiusM) : 'ที่ Admin กำหนด'} ช่วยแจ้งพิกัดแรกได้เลย`
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
    <Stack component="section" id="nearby-search" aria-label="ค้นหาร้านใกล้ฉัน" spacing={2}>
      {!coordinates ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            border: '1px solid var(--palette-grey-300)',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 0 var(--palette-grey-200)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  borderRadius: '12px',
                }}
              >
                <Iconify icon="ri:radar-line" width={30} />
              </Box>
              <Box>
                <Typography component="h2" sx={{ fontSize: 21, fontWeight: 800 }}>
                  พร้อมค้นพบพิกัดใหม่หรือยัง?
                </Typography>
                <Typography
                  sx={{ mt: 0.75, fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}
                >
                  ใช้ตำแหน่งของคุณเพื่อเรียงร้านจากใกล้ที่สุด
                </Typography>
              </Box>
            </Stack>
            <Button
              onClick={() => setLocationDialogOpen(true)}
              disabled={loading}
              variant="contained"
              size="large"
              startIcon={!loading ? <Iconify icon="ri:focus-3-line" /> : undefined}
              sx={locateButtonSx}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'เปิดตำแหน่ง เริ่มค้นหา'}
            </Button>
          </Stack>
        </Paper>
      ) : null}
      {gpsError ? (
        <Alert severity="warning" sx={{ whiteSpace: 'pre-line' }}>
          {gpsError}
        </Alert>
      ) : null}
      {coordinates ? (
        <Box>
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: '5px solid var(--palette-background-paper)',
              borderRadius: '18px',
              boxShadow: '0 16px 48px rgba(65,49,30,.06)',
            }}
          >
            <Box sx={{ overflow: 'hidden', bgcolor: 'background.paper' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px solid var(--palette-grey-200)' }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    component="img"
                    src="/assets/icons/loveza/voxel-map-pin.svg"
                    alt=""
                    width={52}
                    height={52}
                    sx={{ width: 52, height: 52, flexShrink: 0, display: 'block' }}
                  />
                  <Box>
                    <Typography
                      component="h2"
                      sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 800 }}
                    >
                      แผนที่ความซ่าใกล้คุณ
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                      <Box
                        sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }}
                      />
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        ระบุตำแหน่งแล้ว
                        {searchRadiusM ? ` · ค้นหาในระยะ ${formatRadiusM(searchRadiusM)}` : ''}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Button
                  onClick={requestLocation}
                  disabled={loading}
                  variant="outlined"
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Iconify icon="ri:refresh-line" width={18} />
                    )
                  }
                  sx={{
                    flexShrink: 0,
                    minHeight: 44,
                    borderColor: 'divider',
                    color: 'primary.dark',
                    px: 2,
                  }}
                >
                  อัปเดตตำแหน่ง
                </Button>
              </Stack>
              <Box sx={{ p: 2 }}>
                <MerchantStockFilter
                  flavor={flavor}
                  availableOnly={availableOnly}
                  onChange={(nextFlavor, nextAvailable) => {
                    setFlavor(nextFlavor);
                    setAvailableOnly(nextAvailable);
                    setVisibleStoreCount(STORES_PAGE_SIZE);
                    setIsLoadingMore(false);
                  }}
                />
              </Box>
              <NearbyMap coordinates={coordinates} stores={stores} flavor={flavor} />
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="flex-start"
                sx={{ p: 1.75, bgcolor: 'background.default', color: 'text.secondary' }}
              >
                <Iconify icon="ri:information-line" width={16} sx={{ flexShrink: 0, mt: 0.2 }} />
                <Typography sx={{ fontSize: 11, lineHeight: 1.7 }}>
                  ข้อมูลสินค้าจากชุมชนอาจเปลี่ยนแปลง ตรวจสอบเวลาอัปเดตและสอบถามร้านก่อนเดินทาง
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Box>
      ) : null}
      {message ? <Alert severity="info">{message}</Alert> : null}
      {stores.length ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2 }}>
          <div>
            <Typography
              sx={{ color: 'primary.main', fontSize: 10, letterSpacing: 2, fontWeight: 800 }}
            >
              DISCOVERED NEAR YOU
            </Typography>
            <Typography
              sx={{
                color: 'var(--palette-primary-dark)',
                fontSize: { xs: 22, md: 28 },
                fontWeight: 1000,
              }}
            >
              Loveza ใกล้คุณ
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              เรียงจากร้านที่อยู่ใกล้ที่สุด
            </Typography>
          </div>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${stores.length} ร้าน`}
              sx={{
                color: 'var(--palette-background-paper)',
                fontWeight: 900,
                bgcolor: 'var(--palette-primary-main)',
              }}
            />
          </Stack>
        </Stack>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {visibleStores.map((store, index) => {
          const confirmation = merchantConfirmationLabel(store, flavor);
          const status = getStockStatus(store, flavor);
          const quantity = getStockQuantity(store, flavor);
          const storeColor = getNearbyStoreColor(store.id);

          return (
            <Paper
              key={store.id}
              component="article"
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                border: '5px solid var(--palette-background-paper)',
                borderRadius: '18px',
                position: 'relative',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
                transition: 'transform 160ms ease',
                '&:hover': { transform: 'translateY(-3px)' },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 2, pb: 1.5, borderBottom: '2px dashed var(--palette-grey-300)' }}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    fontFamily: 'monospace',
                  }}
                >
                  STORE / {String(index + 1).padStart(2, '0')}
                </Typography>
                <Chip
                  size="small"
                  label={STORE_STATUS_LABEL[status] ?? STORE_STATUS_LABEL.unknown}
                  color={
                    status === 'available'
                      ? 'success'
                      : status === 'low_stock'
                        ? 'warning'
                        : status === 'out_of_stock'
                          ? 'error'
                          : 'default'
                  }
                  sx={{
                    fontWeight: 800,
                    fontSize: 11,
                    borderRadius: '4px',
                    border: '1px solid currentColor',
                    height: 24,
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '4px',
                    border: `2px solid ${storeColor.dark}`,
                    boxShadow: `inset 3px 3px 0 rgba(255,255,255,.65), 3px 3px 0 ${storeColor.soft}`,
                    bgcolor: storeColor.soft,
                    color: storeColor.dark,
                  }}
                >
                  {store.store_type_logo_url ? (
                    <Box
                      component="img"
                      src={store.store_type_logo_url}
                      alt=""
                      sx={{ width: 36, height: 36, objectFit: 'contain' }}
                    />
                  ) : (
                    <Iconify icon="ri:store-2-line" width={25} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: 17,
                      lineHeight: 1.55,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {store.name}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      color: 'text.secondary',
                      fontSize: 12,
                      lineHeight: 1.7,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {[
                      store.address?.trim().toLocaleLowerCase() !==
                      store.name.trim().toLocaleLowerCase()
                        ? store.address
                        : null,
                      store.province,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Box>
              </Stack>
              <Box
                sx={{
                  mt: 2.5,
                  mb: 2,
                  p: 1.5,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                  bgcolor: 'background.default',
                  borderRadius: '12px',
                  alignItems: 'start',
                }}
              >
                <Box>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify icon="ri:map-pin-distance-line" width={14} />
                    <Typography sx={{ fontSize: 11 }}>ระยะจากคุณ</Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'primary.dark',
                    }}
                  >
                    {store.distanceKm.toFixed(1)}{' '}
                    <Box component="span" sx={{ fontSize: 11, fontWeight: 500 }}>
                      กม.
                    </Box>
                  </Typography>
                </Box>
                <Box sx={{ pl: 1.5, borderLeft: '1px solid var(--palette-grey-300)' }}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify icon="ri:drinks-2-line" width={14} />
                    <Typography sx={{ fontSize: 11 }}>จำนวนที่แจ้ง</Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: quantity === null ? 13 : 22,
                      fontWeight: 800,
                    }}
                  >
                    {quantity !== null
                      ? quantity.toLocaleString('th-TH')
                      : 'ไม่ระบุ'}
                    {quantity !== null ? (
                      <Box component="span" sx={{ fontSize: 11, fontWeight: 500 }}>
                        {' '}
                        กระป๋อง
                      </Box>
                    ) : null}
                  </Typography>
                </Box>
              </Box>
              {Boolean(store.merchant_stock_flavors?.length || Object.keys(store.merchant_stock_by_flavor ?? {}).length) && (
                <Typography variant="caption" color="text.secondary">
                  รสที่ร้านแจ้ง: {getMerchantFlavorStockLabels(store.merchant_stock_by_flavor, store.merchant_stock_flavors).join(' · ')}
                </Typography>
              )}
              <Box sx={{ mt: 'auto' }}>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ color: 'text.secondary' }}
                >
                  <Iconify icon="ri:time-line" width={14} sx={{ flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 11, lineHeight: 1.7 }}>
                    {confirmation ?? (store.last_reported_at
                      ? `แจ้งล่าสุด ${formatRelativeTimeTh(store.last_reported_at)}`
                      : 'ยังไม่มีเวลารายงานล่าสุด')}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="flex-start"
                  sx={{ mt: 0.75, color: 'text.secondary' }}
                >
                  <Iconify icon="ri:user-heart-line" width={14} sx={{ mt: 0.2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 11, lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                    {store.stock_updated_by_merchant
                      ? 'อัปเดตโดยร้านค้า'
                      : `โดย ${store.reporter_display_name ?? 'นักสำรวจ Loveza'}`}
                  </Typography>
                </Stack>
                <Button
                  href={buildGoogleMapsUrl(store.latitude, store.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="ri:route-line" />}
                  endIcon={<Iconify icon="ri:arrow-right-up-line" width={17} />}
                  aria-label={`นำทางไป ${store.name}`}
                  sx={{
                    mt: 2,
                    minHeight: 44,
                    justifyContent: 'space-between',
                    px: 2,
                    bgcolor: 'primary.main',
                    '&&': {
                      borderRadius: '12px',
                      border: 0,
                      boxShadow: '0 3px 0 var(--palette-primary-darker)',
                    },
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:active': { transform: 'translateY(2px)' },
                  }}
                >
                  นำทางไปร้านนี้
                </Button>
              </Box>
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
          sx={{ minHeight: 88, pt: 2, pb: 1, color: 'var(--palette-primary-main)' }}
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
          sx={{
            py: 2,
            color: 'text.secondary',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          แสดงครบทั้งหมด {stores.length} ร้านแล้ว
        </Typography>
      ) : null}

      <Dialog
        open={locationDialogOpen && !coordinates}
        onClose={() => setLocationDialogOpen(false)}
        aria-labelledby="nearby-location-title"
        aria-describedby="nearby-location-description"
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              m: 2,
              width: 'calc(100% - 32px)',
              maxWidth: 360,
              maxHeight: 'calc(100dvh - 32px)',
              overflow: 'hidden',
              border: '1px solid var(--palette-grey-300)',
              borderRadius: '20px',
              bgcolor: 'background.paper',
              boxShadow: '0 20px 70px rgba(35,45,30,.2)',
            },
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              position: 'relative',
              height: 132,
              overflow: 'hidden',
              bgcolor: 'primary.lighter',
            }}
          >
            <Box
              component="img"
              src="/assets/loveza/nearby-explorer-v1.webp"
              alt=""
              width={1536}
              height={1024}
              sx={{
                display: 'block',
                width: 1,
                height: 1,
                objectFit: 'cover',
                objectPosition: 'right 48%',
              }}
            />
            <Button
              aria-label="ปิดหน้าต่างขอตำแหน่ง"
              onClick={() => setLocationDialogOpen(false)}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 32,
                width: 32,
                height: 32,
                p: 0,
                borderRadius: '10px',
                bgcolor: 'background.paper',
                color: 'text.primary',
                '&:hover': { bgcolor: 'primary.lighter' },
              }}
            >
              <Iconify icon="ri:close-line" width={20} />
            </Button>
          </Box>
          <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ color: 'primary.main', mb: 1 }}
            >
              <Iconify icon="ri:compass-3-line" width={17} />
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8 }}>
                READY TO EXPLORE?
              </Typography>
            </Stack>
            <DialogTitle
              id="nearby-location-title"
              sx={{ p: 0, fontSize: 24, lineHeight: 1.4, fontWeight: 800 }}
            >
              {gpsError ? 'มาเปิดพิกัดกันอีกครั้ง' : 'เริ่มสำรวจร้านใกล้คุณ'}
            </DialogTitle>
            <Typography
              id="nearby-location-description"
              sx={{ mt: 1.25, fontSize: 13, color: 'text.secondary', lineHeight: 1.85 }}
            >
              เปิดตำแหน่งเพื่อดูร้าน Loveza รอบตัว
              <br />
              พร้อมระยะทางและเส้นทางไปร้าน
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="flex-start"
              sx={{
                mt: 2,
                p: 1.25,
                bgcolor: 'primary.lighter',
                borderRadius: '10px',
                color: 'primary.dark',
              }}
            >
              <Iconify icon="ri:map-pin-user-line" width={17} sx={{ mt: 0.15, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11, lineHeight: 1.7 }}>
                ใช้ตำแหน่งปัจจุบันเพื่อค้นหาร้านใกล้คุณ
              </Typography>
            </Stack>
            {gpsError ? (
              <Alert severity="warning" sx={{ mt: 1.5, fontSize: 12, whiteSpace: 'pre-line' }}>
                {gpsError}
              </Alert>
            ) : null}
            <Box
              component="details"
              open={Boolean(gpsError)}
              sx={{
                mt: 2,
                fontSize: 12,
                color: 'text.secondary',
                '& summary': {
                  cursor: 'pointer',
                  minHeight: 28,
                  fontWeight: 700,
                  color: 'primary.dark',
                  '&:focus-visible': {
                    outline: '2px solid var(--palette-primary-main)',
                    outlineOffset: 3,
                  },
                },
              }}
            >
              <Box component="summary">เคยกดไม่อนุญาตตำแหน่ง?</Box>
              <Stack
                component="ol"
                spacing={1.25}
                sx={{
                  mt: 1.25,
                  mb: 0,
                  pl: 2.25,
                  '& li::marker': { color: 'primary.main', fontWeight: 800 },
                }}
              >
                {locationSettingsSteps.map((step) => (
                  <Typography
                    component="li"
                    key={step}
                    sx={{ pl: 0.5, fontSize: 12, lineHeight: 1.7 }}
                  >
                    {step}
                  </Typography>
                ))}
              </Stack>
              {gpsError?.includes('HTTPS') ? (
                <Typography sx={{ mt: 1.25, fontSize: 11, lineHeight: 1.7 }}>
                  โปรดเปิดเว็บไซต์ผ่าน HTTPS เพื่อขอสิทธิ์ตำแหน่ง
                </Typography>
              ) : null}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          disableSpacing
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            px: 3,
            pt: 2,
            pb: 2.5,
            borderTop: '1px solid var(--palette-grey-200)',
            '& > .MuiButton-root': { m: 0, width: '100%' },
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={handleRequestLocation}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="ri:focus-3-line" />
              )
            }
            sx={{
              ...locateButtonSx,
              borderRadius: '12px',
              minHeight: 46,
              '&&': { boxShadow: '0 3px 0 var(--palette-primary-darker)', border: 0 },
            }}
          >
            {loading
              ? 'กำลังค้นหาตำแหน่ง…'
              : gpsError
                ? 'ลองขอตำแหน่งอีกครั้ง'
                : 'เปิดตำแหน่ง เริ่มสำรวจ'}
          </Button>
          <Button
            color="inherit"
            variant="text"
            fullWidth
            onClick={() => setLocationDialogOpen(false)}
            sx={{
              minHeight: 44,
              color: 'text.secondary',
              fontSize: 12,
              borderRadius: '10px',
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              },
            }}
          >
            ไว้ก่อน สำรวจหน้าเว็บต่อ
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
