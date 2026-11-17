'use client';

import type { Feature, Geometry, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { MapzaStore } from 'src/types/store';
import type { ProvinceColorSettings } from 'src/lib/mapza/province-color-scale';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { supabase } from 'src/lib/supabase';
import { buildProvinceColorScale } from 'src/lib/mapza/province-color-scale';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

type ThailandMapProps = {
  stores: MapzaStore[];
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
  quantity: number;
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

export default function ThailandMap({
  stores,
  provinceColorSettings,
  hasError = false,
}: ThailandMapProps) {
  const router = useRouter();
  const [geoJson, setGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [provinceNames, setProvinceNames] = useState<ProvinceNameRecord[]>([]);
  const [mapError, setMapError] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<'all' | 'found' | 'missing'>('all');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSummary | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceSummary | null>(null);
  const provinceColorScale = useMemo(
    () => buildProvinceColorScale(provinceColorSettings),
    [provinceColorSettings]
  );

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel('mapza-stores-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => router.refresh(), 250);
      })
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
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

  const storesByProvince = useMemo(() => {
    const map = new Map<string, MapzaStore[]>();
    stores.forEach((store) => {
      if (!store.province) return;
      const bucket = map.get(store.province);
      if (bucket) bucket.push(store);
      else map.set(store.province, [store]);
    });
    return map;
  }, [stores]);

  const provinceSummaries = useMemo(() => {
    if (!geoJson) return [];

    return geoJson.features.map((feature, index) => {
      const name = getProvinceName(feature, namesByEnglishName);
      const provinceStores = storesByProvince.get(name) ?? [];
      const quantity = provinceStores.reduce(
        (total, store) => total + Math.max(store.estimated_quantity ?? 0, 0),
        0
      );

      return {
        id: String(feature.properties?.ID_1 ?? feature.id ?? index),
        name,
        quantity,
        geometry: feature.geometry,
        stores: provinceStores,
      } satisfies ProvinceSummary;
    });
  }, [geoJson, namesByEnglishName, storesByProvince]);

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
              setSelectedProvince(province);
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
                      {province.stores.length} จุดขาย · ประมาณ{' '}
                      {province.quantity.toLocaleString('th-TH')} กระป๋อง
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
                onClick={() => setSelectedProvince(province)}
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
                      ? `${province.quantity.toLocaleString('th-TH')} กระป๋องที่ชุมชนแจ้ง`
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

        <Box
          sx={{
            order: 2,
            minWidth: 0,
            position: 'relative',
            bgcolor: 'transparent',
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
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ width: 1, mb: 3 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: 10, color: 'primary.main', fontWeight: 800, letterSpacing: 1.5 }}
                >
                  THAILAND EXPLORER
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 16, fontWeight: 800 }}>
                  {hoveredProvince?.name ??
                    selectedProvince?.name ??
                    'แผนที่ประเทศไทย · 77 จังหวัด'}
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: 11, color: 'text.secondary' }}>
                  {hoveredProvince
                    ? `${hoveredProvince.stores.length} จุดขายจากชุมชน`
                    : selectedProvince
                      ? `${selectedProvince.stores.length} จุดขายจากชุมชน`
                      : 'แตะจังหวัด เพื่อร่วมเติมพิกัดให้แผนที่'}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedProvince(null);
                  setHoveredProvince(null);
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
                    <path
                      key={province.id}
                      d={geometryToPath(province.geometry)}
                      fillRule="evenodd"
                    />
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
                    onOpen={() => setHoveredProvince(province)}
                    onClose={() =>
                      setHoveredProvince((current) =>
                        current?.id === province.id ? null : current
                      )
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
                        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                          {province.name}
                        </Typography>
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
                            ? `แจ้งไว้ประมาณ ${province.quantity.toLocaleString('th-TH')} กระป๋อง`
                            : 'จังหวัดนี้กำลังรอการค้นพบจากคุณ'}
                        </Typography>
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
                      onMouseEnter={() => setHoveredProvince(province)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      onFocus={() => setHoveredProvince(province)}
                      onBlur={() => setHoveredProvince(null)}
                      onClick={() => setSelectedProvince(province)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedProvince(province);
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
              สีแสดงจำนวนจุดขายที่ชุมชนค้นพบ ส่วนจำนวนสินค้าอาจเปลี่ยนแปลง
              ควรตรวจสอบกับร้านก่อนเดินทาง
            </Typography>
          </Box>

          {selectedProvince ? (
            <Box
              sx={{
                m: 2,
                mt: 0,
                p: 2,
                borderRadius: 3,
                bgcolor: 'var(--palette-background-paper)',
                border: '1px solid var(--palette-grey-300)',
                boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 1000 }}>
                    {selectedProvince.name}
                  </Typography>
                  <Typography
                    sx={{ color: 'var(--palette-primary-main)', fontSize: 13, fontWeight: 1000 }}
                  >
                    {selectedProvince.stores.length
                      ? `พบ ${selectedProvince.stores.length} จุดขาย · ประมาณ ${selectedProvince.quantity.toLocaleString('th-TH')} กระป๋อง`
                      : 'ยังไม่มีข้อมูลพิกัด มาเป็นคนแรกที่ช่วยเติมแผนที่กัน'}
                  </Typography>
                </Box>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setSelectedProvince(null)}
                  aria-label="ปิดรายละเอียดจังหวัด"
                  sx={{ minWidth: 36, alignSelf: 'flex-start' }}
                >
                  <Iconify icon="ri:close-line" width={22} />
                </Button>
              </Stack>

              {selectedProvince.stores.length ? (
                <Stack
                  divider={<Divider flexItem />}
                  sx={{ mt: 1.25, maxHeight: 260, overflowY: 'auto' }}
                >
                  {selectedProvince.stores.map((store) => (
                    <Box key={store.id} sx={{ py: 1 }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 1000 }}>
                            {store.name}
                          </Typography>
                          <Typography sx={{ color: 'var(--palette-text-secondary)', fontSize: 11 }}>
                            {[store.district, store.address].filter(Boolean).join(' · ') ||
                              selectedProvince.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              STORE_STATUS_LABEL[store.current_status] ?? STORE_STATUS_LABEL.unknown
                            }
                            sx={{ mt: 0.6, height: 21, fontSize: 10, fontWeight: 900 }}
                          />
                        </Box>
                        <Button
                          component="a"
                          href={buildGoogleMapsUrl(store.latitude, store.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          aria-label={`นำทางไป ${store.name}`}
                          startIcon={<Iconify icon="ri:route-fill" />}
                          sx={{ minWidth: 0, flexShrink: 0, alignSelf: 'center', fontWeight: 900 }}
                        >
                          นำทาง
                        </Button>
                      </Stack>
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
      </Box>
    </>
  );
}
