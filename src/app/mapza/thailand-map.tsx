'use client';

import type { Feature, Geometry, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { MapzaStore } from 'src/types/store';
import type { ProvinceDiscoverer } from 'src/types/province-discoverer';
import type { ProvinceColorSettings } from 'src/lib/mapza/province-color-scale';

import { useRouter } from 'next/navigation';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { supabase } from 'src/lib/supabase';
import { buildProvinceColorScale } from 'src/lib/mapza/province-color-scale';
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
import { STORE_TYPE_OPTIONS, getMerchantFlavorStockLabels } from 'src/types/report';

type StoreFilterOption = { code: string; name: string; logo_url: string | null };

type ThailandMapProps = {
  stores: MapzaStore[];
  storeTypes: StoreFilterOption[];
  discoverers?: ProvinceDiscoverer[];
  discoverersUnavailable?: boolean;
  provinceColorSettings: ProvinceColorSettings;
  hasError?: boolean;
};

type ProvinceNameRecord = {
  provinceNameEn: string;
  provinceNameTh: string;
};

type ProvinceSummary = {
  id: string;
  name: string;
  quantity: number | null;
  geometry: Geometry;
  stores: MapzaStore[];
};

const SVG_WIDTH = 720;
const SVG_HEIGHT = 1300;
const THAILAND_BOUNDS = {
  minLongitude: 97.2,
  maxLongitude: 106,
  minLatitude: 5.4,
  maxLatitude: 20.6,
};

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

function normalizeProvinceName(value: string) {
  const normalized = value.toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g, '');
  if (normalized === 'bangkokmetropolis') return 'bangkok';
  return normalized;
}

function projectPoint([longitude, latitude]: number[]) {
  const x =
    ((longitude - THAILAND_BOUNDS.minLongitude) /
      (THAILAND_BOUNDS.maxLongitude - THAILAND_BOUNDS.minLongitude)) *
    SVG_WIDTH;
  const y =
    ((THAILAND_BOUNDS.maxLatitude - latitude) /
      (THAILAND_BOUNDS.maxLatitude - THAILAND_BOUNDS.minLatitude)) *
    SVG_HEIGHT;
  return [x, y];
}

function ringToPath(ring: number[][]) {
  return ring
    .map((point, index) => {
      const [x, y] = projectPoint(point);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function geometryToPath(geometry: Geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => `${ringToPath(ring)} Z`).join(' ');
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .flatMap((polygon) => polygon.map((ring) => `${ringToPath(ring)} Z`))
      .join(' ');
  }

  return '';
}

function getProvinceColor(storeCount: number, colorScale: { maxCount: number; color: string }[]) {
  const tier = colorScale.find((scale) => storeCount <= scale.maxCount);
  return (tier ?? colorScale[colorScale.length - 1]).color;
}

function getProvinceName(
  feature: Feature<Geometry, GeoJsonProperties>,
  namesByEnglishName: Map<string, string>
) {
  const englishName = String(feature.properties?.NAME_1 ?? '');
  return (
    namesByEnglishName.get(normalizeProvinceName(englishName)) || englishName || 'ไม่ทราบจังหวัด'
  );
}

function formatStockQuantity(quantity: number | null) {
  return quantity == null ? 'ไม่ระบุจำนวน' : `แจ้งไว้ ${quantity.toLocaleString('th-TH')} กระป๋อง`;
}

export default function ThailandMap({
  stores,
  storeTypes,
  discoverers = [],
  discoverersUnavailable = false,
  provinceColorSettings,
  hasError = false,
}: ThailandMapProps) {
  const router = useRouter();
  const discoverersByProvince = useMemo(
    () => new Map(discoverers.map((person) => [person.province.trim(), person])),
    [discoverers]
  );
  const renderDiscoverer = (province: string, small = false) => {
    const person = discoverersByProvince.get(province.trim());
    if (!person)
      return (
        <Typography sx={{ mt: 1, fontSize: 11, color: 'text.secondary' }}>
          {discoverersUnavailable
            ? 'ยังโหลดข้อมูลผู้ค้นพบไม่ได้'
            : 'ยังไม่มีข้อมูลผู้เปิดแผนที่จังหวัดนี้'}
        </Typography>
      );
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          mt: 1.5,
          p: small ? 0 : 1.5,
          bgcolor: small ? 'transparent' : 'primary.lighter',
          borderRadius: '12px',
        }}
      >
        <Avatar
          src={person.avatar_url || undefined}
          alt={person.display_name}
          imgProps={{ referrerPolicy: 'no-referrer' }}
          sx={{
            width: small ? 30 : 48,
            height: small ? 30 : 48,
            bgcolor: 'background.paper',
            color: 'primary.dark',
            border: '2px solid white',
          }}
        >
          {person.display_name.charAt(0)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: small ? 10 : 11, color: 'primary.dark' }}>
            ✦ นักล่าผู้เปิดแผนที่
          </Typography>
          <Typography sx={{ fontSize: small ? 12 : 15, fontWeight: 800, overflowWrap: 'anywhere' }}>
            {person.display_name}
          </Typography>
          {!small && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              แจ้งพิกัดแรกเมื่อ{' '}
              {new Date(person.discovered_at).toLocaleDateString('th-TH', {
                timeZone: 'Asia/Bangkok',
              })}
            </Typography>
          )}
        </Box>
      </Stack>
    );
  };
  const [geoJson, setGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [provinceNames, setProvinceNames] = useState<ProvinceNameRecord[]>([]);
  const [mapError, setMapError] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<'all' | 'found' | 'missing'>('all');
  const [flavor, setFlavor] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const restoreFullscreenFocus = useRef(false);

  const closeFullscreen = () => {
    restoreFullscreenFocus.current = true;
    setFullscreen(false);
  };

  useEffect(() => {
    if (!fullscreen && restoreFullscreenFocus.current) {
      fullscreenButton.current?.focus();
      restoreFullscreenFocus.current = false;
    }
  }, [fullscreen]);

  const provinceColorScale = useMemo(
    () => buildProvinceColorScale(provinceColorSettings),
    [provinceColorSettings]
  );

  useEffect(() => {
    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (disposed || refreshTimer || document.visibilityState !== 'visible') return;

      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        router.refresh();
      }, 250);
    };

    const channel = supabase
      .channel('mapza-stores-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, refresh)
      .subscribe((status) => {
        if (disposed) return;
        setLiveConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') refresh();
      });

    // Catch up after a disconnect and reconcile rows hidden by public store visibility rules.
    const fallbackTimer = setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);

    return () => {
      disposed = true;
      clearTimeout(refreshTimer);
      clearInterval(fallbackTimer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch('/assets/data/thailand-provinces.geojson', { signal: controller.signal }).then(
        (response) => {
          if (!response.ok) throw new Error('Unable to load Thailand GeoJSON');
          return response.json() as Promise<FeatureCollection<Geometry>>;
        }
      ),
      fetch('/assets/data/thailand-province-names.json', { signal: controller.signal }).then(
        (response) => {
          if (!response.ok) throw new Error('Unable to load province names');
          return response.json() as Promise<ProvinceNameRecord[]>;
        }
      ),
    ])
      .then(([geometry, names]) => {
        setGeoJson(geometry);
        setProvinceNames(names);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setMapError(true);
      });

    return () => controller.abort();
  }, []);

  const namesByEnglishName = useMemo(
    () =>
      new Map(
        provinceNames.map((province) => [
          normalizeProvinceName(province.provinceNameEn),
          province.provinceNameTh,
        ])
      ),
    [provinceNames]
  );

  const storeOptions = useMemo(() => {
    const codes = new Set(stores.map((store) => store.store_type || 'unknown'));
    const options = [...storeTypes];
    storeTypes.forEach(({ code }) => codes.delete(code));
    for (const code of codes) {
      const name = STORE_TYPE_OPTIONS.find(({ value }) => value === code)?.label ?? code;
      options.push({ code, name, logo_url: null });
    }
    return options;
  }, [stores, storeTypes]);
  const selectedStoreType = storeOptions.find(({ code }) => code === storeFilter) ?? null;
  const selectedStoreCode = selectedStoreType?.code;

  const storesByProvince = useMemo(() => {
    const map = new Map<string, MapzaStore[]>();
    stores.forEach((store) => {
      if (
        !store.province ||
        (selectedStoreCode && (store.store_type || 'unknown') !== selectedStoreCode) ||
        !matchesMerchantStock(store, flavor, availableOnly)
      )
        return;
      const bucket = map.get(store.province);
      if (bucket) bucket.push(store);
      else map.set(store.province, [store]);
    });
    if (flavor || availableOnly) {
      map.forEach((bucket) => bucket.sort((a, b) => newestMerchantStockFirst(a, b, flavor)));
    }
    return map;
  }, [stores, selectedStoreCode, flavor, availableOnly]);

  const provinceSummaries = useMemo(() => {
    if (!geoJson) return [];

    return geoJson.features.map((feature, index) => {
      const name = getProvinceName(feature, namesByEnglishName);
      const provinceStores = storesByProvince.get(name) ?? [];
      let quantity: number | null = null;
      for (const store of provinceStores) {
        const amount = getStockQuantity(store, flavor);
        if (amount != null) quantity = (quantity ?? 0) + Math.max(amount, 0);
      }

      return {
        id: String(feature.properties?.ID_1 ?? feature.id ?? index),
        name,
        quantity,
        geometry: feature.geometry,
        stores: provinceStores,
      } satisfies ProvinceSummary;
    });
  }, [geoJson, namesByEnglishName, storesByProvince, flavor]);

  const selectedProvince = provinceSummaries.find(({ id }) => id === selectedProvinceId);
  const hoveredProvince = provinceSummaries.find(({ id }) => id === hoveredProvinceId);

  const activeProvinces = useMemo(
    () =>
      provinceSummaries
        .filter((province) => province.stores.length > 0)
        .sort((a, b) => b.stores.length - a.stores.length),
    [provinceSummaries]
  );

  const allProvinces = useMemo(
    () =>
      [...provinceSummaries].sort(
        (a, b) => b.stores.length - a.stores.length || a.name.localeCompare(b.name, 'th')
      ),
    [provinceSummaries]
  );
  const filteredProvinces = useMemo(() => {
    const keyword = provinceSearch.trim().toLocaleLowerCase('th-TH');
    return allProvinces.filter(
      (province) =>
        (provinceFilter === 'all' ||
          (provinceFilter === 'found'
            ? province.stores.length > 0
            : province.stores.length === 0)) &&
        (!keyword || province.name.toLocaleLowerCase('th-TH').includes(keyword))
    );
  }, [allProvinces, provinceSearch, provinceFilter]);
  const foundCount = activeProvinces.length;
  const totalProvinces = provinceSummaries.length;
  const remainingCount = totalProvinces - foundCount;
  const progress = totalProvinces ? Math.round((foundCount / totalProvinces) * 100) : 0;

  if (mapError) {
    return <Alert severity="error">โหลดขอบเขตแผนที่ประเทศไทยไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>;
  }

  if (!geoJson || !provinceNames.length) {
    return <Skeleton variant="rounded" height={680} sx={{ borderRadius: 4 }} />;
  }

  const mapExplorer = (
    <Box
      sx={{
        order: 2,
        minWidth: 0,
        position: 'relative',
        bgcolor: 'transparent',
        ...(fullscreen && { width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }),
      }}
    >
      <Box
        sx={{
          px: { xs: 0, sm: 1 },
          pt: { xs: 1.5, sm: 2 },
          pb: 2,
          display: 'grid',
          position: 'relative',
          placeItems: 'center',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.25}
          sx={{ width: 1, mb: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75} alignItems="center">
              <Typography component="h3" sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800 }}>
                {hoveredProvince?.name ?? selectedProvince?.name ?? 'แผนที่ประเทศไทย · 77 จังหวัด'}
              </Typography>
              <Chip
                size="small"
                variant="soft"
                color={liveConnected ? 'success' : 'default'}
                label={liveConnected ? 'อัปเดตสด' : 'ตรวจข้อมูลทุก 30 วินาที'}
                aria-live="polite"
              />
            </Stack>
            <Typography sx={{ mt: 0.25, fontSize: 11, color: 'text.secondary' }}>
              {hoveredProvince
                ? `${hoveredProvince.stores.length} จุดขายจากชุมชน`
                : selectedProvince
                  ? `${selectedProvince.stores.length} จุดขายจากชุมชน`
                  : 'แตะจังหวัด เพื่อร่วมเติมพิกัดให้แผนที่'}
            </Typography>
          </Box>
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            spacing={0.75}
            sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: '100%' }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedProvinceId(null);
                setHoveredProvinceId(null);
                setStoreFilter(null);
                setFlavor('');
                setAvailableOnly(false);
              }}
              startIcon={<Iconify icon="ri:focus-3-line" width={16} />}
              sx={{
                flexShrink: 0,
                minHeight: 40,
                color: 'primary.dark',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                px: 1.5,
              }}
            >
              ดูทั้งหมด
            </Button>
            <Button
              ref={fullscreen ? undefined : fullscreenButton}
              size="small"
              variant="outlined"
              autoFocus={fullscreen}
              onClick={fullscreen ? closeFullscreen : () => setFullscreen(true)}
              startIcon={
                <Iconify
                  icon={fullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'}
                  width={16}
                />
              }
              sx={{ minHeight: 40, bgcolor: 'background.paper', borderColor: 'divider', px: 1.5 }}
            >
              {fullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
            </Button>
          </Stack>
        </Stack>
        <Stack
          role="group"
          aria-label="ตัวกรองจุดขาย"
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          flexWrap={{ sm: 'wrap' }}
          gap={1.25}
          sx={{
            width: 1,
            mb: 2,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            '& .MuiAutocomplete-root': { bgcolor: 'transparent' },
            '& .MuiFormControlLabel-label': { fontSize: 13, fontWeight: 600 },
          }}
        >
          <Autocomplete
            size="small"
            options={storeOptions}
            value={selectedStoreType}
            getOptionLabel={({ name }) => name}
            getOptionKey={({ code }) => code}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, option) => {
              setStoreFilter(option?.code ?? null);
              setHoveredProvinceId(null);
            }}
            noOptionsText="ไม่พบร้านค้า"
            clearText="แสดงทุกร้าน"
            renderInput={(params) => (
              <TextField {...params} label="ร้านค้า" placeholder="ทุกร้าน" />
            )}
            renderOption={({ key, ...props }, option) => (
              <Box component="li" {...props} key={key} sx={{ gap: 1 }}>
                <Avatar
                  src={option.logo_url || '/assets/icons/loveza/voxel-store.svg'}
                  alt=""
                  sx={{ width: 24, height: 24, bgcolor: 'background.neutral' }}
                />
                {option.name}
              </Box>
            )}
            sx={{ width: { xs: '100%', sm: 190 } }}
          />
          <MerchantStockFilter
            flavor={flavor}
            availableOnly={availableOnly}
            onChange={(nextFlavor, nextAvailable) => {
              setFlavor(nextFlavor);
              setAvailableOnly(nextAvailable);
              setHoveredProvinceId(null);
            }}
          />
        </Stack>
        <Box
          component="svg"
          viewBox={`-12 -12 ${SVG_WIDTH + 24} ${SVG_HEIGHT + 24}`}
          role="group"
          aria-label="แผนที่จังหวัดประเทศไทย แสดงจำนวนจุดขาย Loveza"
          sx={{
            width: 1,
            height: 'auto',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            maxWidth: { xs: '100%', sm: 540, md: 600, lg: 720 },
            aspectRatio: `${SVG_WIDTH} / ${SVG_HEIGHT}`,
            ...(fullscreen && { maxHeight: 'max(420px, calc(100dvh - 150px))' }),
            overflow: 'visible',
            filter: 'drop-shadow(0 10px 12px rgba(48,63,35,.08))',
            '& path[role="button"]:focus-visible': {
              outline: 'none',
              stroke: 'var(--palette-primary-dark)',
              strokeWidth: 2.5,
            },
            '@media (prefers-reduced-motion: reduce)': {
              '& path': { transition: 'none !important' },
            },
          }}
        >
          <g
            aria-hidden="true"
            transform="translate(0 7)"
            fill="var(--palette-primary-dark)"
            opacity="0.2"
            style={{ pointerEvents: 'none' }}
          >
            {provinceSummaries
              .filter((province) => province.stores.length > 0)
              .map((province) => (
                <path key={province.id} d={geometryToPath(province.geometry)} fillRule="evenodd" />
              ))}
          </g>
          {provinceSummaries.map((province) => {
            const selected = selectedProvince?.id === province.id;
            return (
              <Tooltip
                key={province.id}
                describeChild
                arrow
                followCursor
                disableInteractive
                open={hoveredProvince?.id === province.id}
                onOpen={() => setHoveredProvinceId(province.id)}
                onClose={() =>
                  setHoveredProvinceId((current) => (current === province.id ? null : current))
                }
                enterDelay={120}
                enterTouchDelay={400}
                leaveTouchDelay={2500}
                slotProps={{
                  transition: { timeout: 0 },
                  tooltip: {
                    sx: {
                      p: 1.5,
                      maxWidth: 230,
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      border: '1px solid var(--palette-grey-300)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(48,63,35,.14)',
                    },
                  },
                  arrow: { sx: { color: 'background.paper' } },
                }}
                title={
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{province.name}</Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{ mt: 0.75, color: 'primary.dark' }}
                    >
                      <Iconify icon="ri:store-2-line" width={15} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                        {province.stores.length
                          ? `${province.stores.length.toLocaleString('th-TH')} จุดขาย`
                          : 'ภารกิจ: ค้นพบพิกัดแรก'}
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{ mt: 0.5, color: 'text.secondary', fontSize: 11, lineHeight: 1.7 }}
                    >
                      {province.stores.length
                        ? formatStockQuantity(province.quantity)
                        : 'จังหวัดนี้กำลังรอการค้นพบจากคุณ'}
                    </Typography>
                    {province.stores.length > 0 && renderDiscoverer(province.name, true)}
                    <Typography sx={{ mt: 0.75, color: 'primary.main', fontSize: 10 }}>
                      แตะเพื่อดูรายละเอียดจังหวัด
                    </Typography>
                  </Box>
                }
              >
                <path
                  d={geometryToPath(province.geometry)}
                  fill={
                    province.stores.length
                      ? getProvinceColor(province.stores.length, provinceColorScale)
                      : 'var(--palette-background-paper)'
                  }
                  fillOpacity={province.stores.length ? 1 : 0}
                  fillRule="evenodd"
                  stroke={
                    province.stores.length ? 'var(--palette-background-paper)' : 'transparent'
                  }
                  strokeWidth={province.stores.length ? 1.1 : 0}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  role="button"
                  tabIndex={0}
                  aria-label={`${province.name} ${province.stores.length} จุดขาย`}
                  aria-pressed={selected}
                  onMouseEnter={() => setHoveredProvinceId(province.id)}
                  onMouseLeave={() => setHoveredProvinceId(null)}
                  onFocus={() => setHoveredProvinceId(province.id)}
                  onBlur={() => setHoveredProvinceId(null)}
                  onClick={() => setSelectedProvinceId(province?.id ?? null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedProvinceId(province?.id ?? null);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: selected || hoveredProvince?.id === province.id ? 1 : 0.94,
                    transition: 'opacity 160ms ease, filter 160ms ease',
                    filter:
                      selected || hoveredProvince?.id === province.id
                        ? 'brightness(1.07)'
                        : undefined,
                  }}
                />
              </Tooltip>
            );
          })}
          {selectedProvince ? (
            <path
              aria-hidden="true"
              d={geometryToPath(selectedProvince.geometry)}
              fill="none"
              fillRule="evenodd"
              stroke="var(--palette-primary-dark)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          ) : null}
        </Box>
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          justifyContent="center"
          spacing={1.5}
          aria-label="จำนวนจุดขายตามสีจังหวัด"
          sx={{
            mt: 2,
            px: 0,
            py: 0.5,
            width: 1,
          }}
        >
          {provinceColorScale.map((item) => (
            <Stack
              key={item.label}
              direction="row"
              spacing={0.6}
              alignItems="center"
              sx={{ px: 1, py: 0.6, borderRadius: '6px', bgcolor: 'background.paper' }}
            >
              <Box
                component="span"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '3px',
                  bgcolor: item.maxCount === 0 ? 'var(--palette-background-paper)' : item.color,
                  border: '1px solid rgba(48,63,35,.12)',
                }}
              />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                {item.maxCount === 0 ? 'รอการค้นพบ' : item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Typography
          sx={{
            mt: 1.25,
            maxWidth: 560,
            color: 'text.secondary',
            fontSize: 10,
            lineHeight: 1.8,
            textAlign: 'center',
          }}
        >
          สีแสดงจำนวนจุดขายที่ชุมชนค้นพบ ส่วนจำนวนสินค้าอาจเปลี่ยนแปลง ควรตรวจสอบกับร้านก่อนเดินทาง
        </Typography>
      </Box>

      {selectedProvince ? (
        <Box
          component="section"
          aria-label={`จุดขายใน${selectedProvince.name}`}
          sx={{
            mx: { xs: 1, sm: 2 },
            mb: 2,
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: '18px',
            bgcolor: 'background.default',
            border: '5px solid var(--palette-background-paper)',
            boxShadow: '0 16px 48px rgba(65,49,30,.06)',
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.25}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 42,
                height: 42,
                borderRadius: '12px',
                flexShrink: 0,
                bgcolor: 'primary.lighter',
                color: 'primary.dark',
              }}
            >
              <Iconify icon="ri:map-pin-2-fill" width={22} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h3" sx={{ fontSize: { xs: 19, sm: 23 }, fontWeight: 900 }}>
                {selectedProvince.name}
              </Typography>
              <Typography sx={{ color: 'primary.dark', fontSize: 13, fontWeight: 800 }}>
                {selectedProvince.stores.length
                  ? `พบ ${selectedProvince.stores.length.toLocaleString('th-TH')} จุดขาย · ${formatStockQuantity(selectedProvince.quantity)}`
                  : 'มาเป็นคนแรกที่ช่วยปักหมุดจังหวัดนี้'}
              </Typography>
            </Box>
            <Button
              color="inherit"
              size="small"
              onClick={() => setSelectedProvinceId(null)}
              aria-label="ปิดรายละเอียดจังหวัด"
              sx={{
                minWidth: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'background.neutral',
              }}
            >
              <Iconify icon="ri:close-line" width={22} />
            </Button>
          </Stack>

          {selectedProvince.stores.length > 0 && renderDiscoverer(selectedProvince.name)}

          {selectedProvince.stores.length ? (
            <Stack spacing={1} sx={{ mt: 1.5, maxHeight: 320, overflowY: 'auto' }}>
              {selectedProvince.stores.map((store) => (
                <Box
                  key={store.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'auto minmax(0, 1fr)',
                      sm: 'auto minmax(0, 1fr) auto',
                    },
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1.25,
                    bgcolor: 'background.paper',
                    border: '1px solid var(--palette-grey-300)',
                    borderRadius: '16px',
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={store.store_type_logo_url || '/assets/icons/loveza/voxel-store.svg'}
                    alt=""
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: 'primary.lighter',
                      color: 'primary.dark',
                      '& img': { objectFit: 'contain' },
                    }}
                  >
                    <Iconify icon="ri:store-2-fill" width={22} />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, overflowWrap: 'anywhere' }}>
                      {store.name}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {[store.district, store.address].filter(Boolean).join(' · ') ||
                        selectedProvince.name}
                    </Typography>
                    {Boolean(store.merchant_stock_flavors?.length || Object.keys(store.merchant_stock_by_flavor ?? {}).length) && (
                      <Typography variant="caption" color="text.secondary">
                        รสที่ร้านแจ้ง:{' '}
                        {getMerchantFlavorStockLabels(store.merchant_stock_by_flavor, store.merchant_stock_flavors).join(' · ')}
                      </Typography>
                    )}
                    <Typography display="block" variant="caption" color="text.secondary">
                      {merchantConfirmationLabel(store, flavor)}
                    </Typography>
                    <Chip
                      size="small"
                      label={STORE_STATUS_LABEL[getStockStatus(store, flavor)] ?? STORE_STATUS_LABEL.unknown}
                      color={
                        (
                          {
                            available: 'success',
                            low_stock: 'warning',
                            out_of_stock: 'error',
                            unknown: 'default',
                          } as const
                        )[getStockStatus(store, flavor)] ?? 'default'
                      }
                      variant="outlined"
                      sx={{ mt: 0.75, height: 22, fontSize: 11, fontWeight: 800 }}
                    />
                  </Box>
                  <Button
                    component="a"
                    href={buildGoogleMapsUrl(store.latitude, store.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    aria-label={`นำทางไป ${store.name}`}
                    startIcon={<Iconify icon="ri:route-fill" />}
                    sx={{
                      gridColumn: { xs: '2', sm: 'auto' },
                      justifySelf: 'start',
                      minHeight: 36,
                      px: 1.5,
                    }}
                  >
                    นำทาง
                  </Button>
                </Box>
              ))}
            </Stack>
          ) : (
            <Button
              href="/report"
              size="small"
              variant="contained"
              startIcon={<Iconify icon="ri:map-pin-add-fill" />}
              sx={{ mt: 1.5, fontWeight: 900 }}
            >
              ช่วยปักหมุดแรกของจังหวัดนี้
            </Button>
          )}
        </Box>
      ) : null}
    </Box>
  );

  return (
    <>
      {!hasError ? (
        <Box
          component="section"
          aria-label="ความคืบหน้าภารกิจชุมชน"
          sx={{
            p: { xs: 1.5, md: 2 },
            mb: 2.5,
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 0 var(--palette-grey-200)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ color: 'primary.main' }}
              >
                <Iconify icon="ri:flag-2-line" width={15} />
                <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>
                  ภารกิจของทุกคน
                </Typography>
              </Stack>
              <Typography
                component="h3"
                sx={{ mt: 0.5, fontSize: { xs: 19, md: 22 }, fontWeight: 800 }}
              >
                ค้นพบแล้ว {foundCount} / {totalProvinces} จังหวัด
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 11, color: 'text.secondary', lineHeight: 1.7 }}>
                {remainingCount > 0
                  ? `อีก ${remainingCount} จังหวัด รอทุกคนช่วยกันปักหมุดแรก`
                  : 'ครบทุกจังหวัดแล้ว! มาช่วยกันเพิ่มร้านและอัปเดตพิกัดให้สดใหม่'}
              </Typography>
            </Box>
            <Button
              href="/report"
              variant="contained"
              size="small"
              startIcon={<Iconify icon="ri:map-pin-add-line" />}
              sx={{ flexShrink: 0 }}
            >
              ร่วมเติมแผนที่
            </Button>
          </Stack>
          <Box
            role="progressbar"
            aria-label="จังหวัดที่มีพิกัด Loveza"
            aria-valuenow={foundCount}
            aria-valuemin={0}
            aria-valuemax={totalProvinces}
            sx={{
              mt: 1.5,
              height: 8,
              borderRadius: '4px',
              overflow: 'hidden',
              bgcolor: 'primary.lighter',
              border: '1px solid var(--palette-grey-300)',
            }}
          >
            <Box
              sx={{
                width: `${progress}%`,
                height: 1,
                bgcolor: 'primary.main',
                minWidth: foundCount ? 4 : 0,
              }}
            />
          </Box>
          <Typography sx={{ mt: 0.75, fontSize: 10, color: 'text.secondary' }}>
            สำเร็จ {progress}% · จากจังหวัดที่มีพิกัดร้านในระบบ
          </Typography>
        </Box>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr',
            md: '280px minmax(0, 1fr)',
            lg: '310px minmax(0, 1fr)',
          },
        }}
      >
        <Box
          sx={{
            order: 1,
            p: 2,
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
          }}
        >
          <Typography sx={{ fontSize: 19, fontWeight: 800 }}>เลือกพื้นที่ทำภารกิจ</Typography>
          <Typography
            sx={{
              mt: 0.4,
              mb: 2,
              color: 'var(--palette-text-secondary)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ค้นหาจังหวัดของคุณ แล้วช่วยเติมพิกัดใหม่
          </Typography>

          <Autocomplete
            fullWidth
            autoHighlight
            options={allProvinces}
            inputValue={provinceSearch}
            value={allProvinces.find((province) => province.id === selectedProvince?.id) ?? null}
            getOptionLabel={(province) => province.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="ไม่พบจังหวัดที่ค้นหา"
            onInputChange={(_event, value) => setProvinceSearch(value)}
            onChange={(_event, province) => {
              setSelectedProvinceId(province?.id ?? null);
              setProvinceFilter('all');
              setProvinceSearch(province?.name ?? '');
            }}
            renderOption={(props, province) => {
              const { key, ...optionProps } = props;
              return (
                <Box component="li" {...optionProps} key={key} sx={{ gap: 1.25 }}>
                  <Iconify
                    icon="ri:map-pin-2-fill"
                    width={20}
                    sx={{ color: 'var(--palette-primary-main)' }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{province.name}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                      {province.stores.length} จุดขาย ·{' '}
                      {formatStockQuantity(province.quantity)}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="ค้นหาจังหวัด"
                placeholder="พิมพ์ชื่อจังหวัด"
              />
            )}
            sx={{
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'var(--palette-background-paper)',
                borderRadius: 2.5,
              },
            }}
          />

          <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} aria-label="กรองสถานะจังหวัด">
            {(
              [
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'missing', label: 'รอค้นพบ' },
                { value: 'found', label: 'มีพิกัดแล้ว' },
              ] as const
            ).map((filter) => (
              <Button
                key={filter.value}
                size="small"
                aria-pressed={provinceFilter === filter.value}
                onClick={() => setProvinceFilter(filter.value)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  px: 0.5,
                  fontSize: 11,
                  bgcolor: provinceFilter === filter.value ? 'primary.lighter' : 'transparent',
                  color: provinceFilter === filter.value ? 'primary.dark' : 'text.secondary',
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Stack>
          {hasError ? <Alert severity="error">โหลดข้อมูลจุดขายไม่สำเร็จ</Alert> : null}
          {!hasError && activeProvinces.length === 0 ? (
            <Alert severity="info">ยังไม่มีข้อมูลจุดขายบนแผนที่</Alert>
          ) : null}

          <Box
            sx={{
              gap: 1.1,
              pr: 0.75,
              display: 'flex',
              overflowY: 'auto',
              flexDirection: 'column',
              maxHeight: { xs: 230, md: 600 },
            }}
          >
            {!hasError && filteredProvinces.length === 0 ? (
              <Alert severity="info">ไม่พบจังหวัดที่ค้นหา</Alert>
            ) : null}

            {filteredProvinces.map((province) => (
              <Box
                key={province.id}
                component="button"
                type="button"
                aria-pressed={selectedProvince?.id === province.id}
                onClick={() => setSelectedProvinceId(province?.id ?? null)}
                sx={{
                  p: 1.4,
                  gap: 1.25,
                  width: 1,
                  display: 'flex',
                  color: 'var(--palette-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  alignItems: 'center',
                  borderRadius: '10px',
                  bgcolor: 'background.default',
                  border: '1px solid transparent',
                  transition: 'background-color 160ms ease, border-color 160ms ease',
                  ...(selectedProvince?.id === province.id && {
                    bgcolor: 'primary.lighter',
                    borderColor: 'primary.main',
                  }),
                  '&:hover': { bgcolor: 'primary.lighter' },
                  '&:focus-visible': {
                    outline: '2px solid var(--palette-primary-main)',
                    outlineOffset: -2,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    display: 'grid',
                    flexShrink: 0,
                    borderRadius: '10px',
                    placeItems: 'center',
                    color: 'var(--palette-background-paper)',
                    bgcolor: 'var(--palette-primary-main)',
                    border: '1px solid var(--palette-primary-dark)',
                  }}
                >
                  <Iconify icon="ri:map-pin-2-fill" width={20} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 1000 }}>{province.name}</Typography>
                  <Typography
                    sx={{ color: 'var(--palette-text-secondary)', fontSize: 11, fontWeight: 800 }}
                  >
                    {province.stores.length
                      ? formatStockQuantity(province.quantity)
                      : 'ช่วยปักหมุดแรกของจังหวัดนี้'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 1000 }}>
                  {province.stores.length || (
                    <Iconify icon="ri:flag-2-line" width={18} sx={{ color: 'text.secondary' }} />
                  )}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {fullscreen ? (
          <Dialog
            open
            fullScreen
            onClose={closeFullscreen}
            aria-label="แผนที่ประเทศไทยแบบเต็มจอ"
            slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
          >
            {mapExplorer}
          </Dialog>
        ) : (
          mapExplorer
        )}
      </Box>
    </>
  );
}
