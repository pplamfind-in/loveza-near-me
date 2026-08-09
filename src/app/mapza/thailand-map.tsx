'use client';

import type { Feature, Geometry, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { MapzaStore } from 'src/types/store';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

type ThailandMapProps = {
  stores: MapzaStore[];
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

const PROVINCE_COLOR_SCALE = [
  { maxCount: 0, color: '#b1bfbf', label: 'ยังไม่มีข้อมูล' },
  { maxCount: 2, color: '#70E1F5', label: '1-2 จุดขาย' },
  { maxCount: 6, color: '#FDE047', label: '3-6 จุดขาย' },
  { maxCount: 14, color: '#FF78B8', label: '7-14 จุดขาย' },
  { maxCount: Infinity, color: '#E5007E', label: '15 จุดขายขึ้นไป' },
] as const;

function getProvinceColor(storeCount: number) {
  const tier = PROVINCE_COLOR_SCALE.find((scale) => storeCount <= scale.maxCount);
  return (tier ?? PROVINCE_COLOR_SCALE[PROVINCE_COLOR_SCALE.length - 1]).color;
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

export default function ThailandMap({ stores, hasError = false }: ThailandMapProps) {
  const [geoJson, setGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [provinceNames, setProvinceNames] = useState<ProvinceNameRecord[]>([]);
  const [mapError, setMapError] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSummary | null>(null);

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

  const filteredProvinces = useMemo(() => {
    const keyword = provinceSearch.trim().toLocaleLowerCase('th-TH');
    if (!keyword) return activeProvinces;
    return activeProvinces.filter((province) =>
      province.name.toLocaleLowerCase('th-TH').includes(keyword)
    );
  }, [activeProvinces, provinceSearch]);

  if (mapError) {
    return <Alert severity="error">โหลดขอบเขตแผนที่ประเทศไทยไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>;
  }

  if (!geoJson || !provinceNames.length) {
    return <Skeleton variant="rounded" height={680} sx={{ borderRadius: 4 }} />;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', lg: '330px minmax(0, 1fr)' },
      }}
    >
      <Box
        sx={{
          order: { xs: 2, lg: 1 },
          p: 2,
          border: '3px solid #351129',
          borderRadius: 4,
          bgcolor: '#FFFDF5',
          boxShadow: '7px 8px 0 #351129',
        }}
      >
        <Typography sx={{ fontSize: 19, fontWeight: 1000 }}>จังหวัดที่มีความซ่า</Typography>
        <Typography sx={{ mt: 0.4, mb: 2, color: '#6C5870', fontSize: 12, fontWeight: 700 }}>
          เรียงตามจำนวนจุดขาย Loveza
        </Typography>

        <Autocomplete
          fullWidth
          autoHighlight
          options={activeProvinces}
          inputValue={provinceSearch}
          value={
            activeProvinces.find((province) => province.id === selectedProvince?.id) ?? null
          }
          getOptionLabel={(province) => province.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText="ไม่พบจังหวัดที่มีจุดขาย"
          onInputChange={(_event, value) => setProvinceSearch(value)}
          onChange={(_event, province) => {
            setSelectedProvince(province);
            setProvinceSearch(province?.name ?? '');
          }}
          renderOption={(props, province) => {
            const { key, ...optionProps } = props;
            return (
              <Box component="li" {...optionProps} key={key} sx={{ gap: 1.25 }}>
                <Iconify icon="ri:map-pin-2-fill" width={20} sx={{ color: '#E5007E' }} />
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
            <TextField {...params} size="small" label="ค้นหาจังหวัด" placeholder="พิมพ์ชื่อจังหวัด" />
          )}
          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2.5 } }}
        />

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
            maxHeight: { xs: 400, lg: 800 },
          }}
        >
          {!hasError && activeProvinces.length > 0 && filteredProvinces.length === 0 ? (
            <Alert severity="info">ไม่พบจังหวัดที่ค้นหา</Alert>
          ) : null}

          {filteredProvinces.map((province, index) => (
            <Box
              key={province.id}
              component="button"
              type="button"
              onClick={() => setSelectedProvince(province)}
              sx={{
                p: 1.4,
                gap: 1.25,
                width: 1,
                display: 'flex',
                color: '#351129',
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
                borderRadius: 2.5,
                bgcolor: index % 3 === 0 ? '#FFF0F7' : index % 3 === 1 ? '#dee3e4' : '#FFF8D8',
                border: '2px solid #351129',
                boxShadow: '3px 3px 0 #351129',
                ...(selectedProvince?.id === province.id && {
                  bgcolor: '#FDE047',
                  boxShadow: '1px 2px 0 #351129',
                  transform: 'translateY(1px)',
                }),
                '&:hover, &:focus-visible': { outline: 'none', transform: 'translateY(-1px)' },
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: 'grid',
                  flexShrink: 0,
                  borderRadius: '50%',
                  placeItems: 'center',
                  color: '#fff',
                  bgcolor: '#E5007E',
                  border: '2px solid #26121f',
                }}
              >
                <Iconify icon="ri:map-pin-2-fill" width={20} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 1000 }}>{province.name}</Typography>
                <Typography sx={{ color: '#6C5870', fontSize: 11, fontWeight: 800 }}>
                  {province.quantity.toLocaleString('th-TH')} กระป๋องโดยประมาณ
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 22, fontWeight: 1000 }}>
                {province.stores.length}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          order: { xs: 1, lg: 2 },
          minWidth: 0,
          overflow: 'hidden',
          position: 'relative',
          border: '3px solid #351129',
          borderRadius: 4,
          bgcolor: '#feffff',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(243, 222, 222, 0.07), transparent 28%), repeating-linear-gradient(165deg, transparent 0 34px, rgba(255,255,255,.07) 35px 36px)',
          boxShadow: '7px 8px 0 #351129',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{
            zIndex: 2,
            top: { sm: 14 },
            left: { sm: 14 },
            right: { sm: 14 },
            m: { xs: 1.5, sm: 0 },
            mb: { xs: 0, sm: 0 },
            position: { xs: 'relative', sm: 'absolute' },
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              p: 1.2,
              px: 3,
              gap: 0.8,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,.94)',
              border: '2px solid #351129',
              boxShadow: '3px 3px 0 #351129',
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 1000 }}>สถานะจังหวัด</Typography>
            {PROVINCE_COLOR_SCALE.map((item) => (
              <Typography
                key={item.label}
                sx={{
                  display: 'flex',
                  gap: 0.7,
                  alignItems: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <Box
                  component="span"
                  sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: item.color }}
                />
                {item.label}
              </Typography>
            ))}
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={() => setSelectedProvince(null)}
            startIcon={<Iconify icon="ri:focus-3-line" />}
            sx={{
              height: 38,
              color: '#351129',
              pointerEvents: 'auto',
              border: '2px solid #351129',
              borderRadius: 99,
              bgcolor: '#FDE047',
              boxShadow: '3px 3px 0 #351129',
              '&:hover': { bgcolor: '#FFE96B' },
            }}
          >
            ดูทั้งประเทศ
          </Button>
        </Stack>

        <Box
          sx={{
            px: { xs: 1.5, sm: 3 },
            pt: { xs: 1.5, sm: 4 },
            pb: 2,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            component="svg"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            role="img"
            aria-label="แผนที่จังหวัดประเทศไทย แสดงจำนวนจุดขาย Loveza"
            sx={{
              width: 1,
              height: 'auto',
              maxWidth: { xs: 440, md: 620 },
              aspectRatio: `${SVG_WIDTH} / ${SVG_HEIGHT}`,
              overflow: 'visible',
              filter: 'drop-shadow(0 10px 12px rgba(53,17,41,.18))',
            }}
          >
            <title>แผนที่ซ่าทั่วไทย</title>
            {provinceSummaries.map((province) => {
              const selected = selectedProvince?.id === province.id;
              return (
                <path
                  key={province.id}
                  d={geometryToPath(province.geometry)}
                  fill={getProvinceColor(province.stores.length)}
                  fillRule="evenodd"
                  stroke={selected ? '#351129' : '#FFFFFF'}
                  strokeWidth={selected ? 4 : 1.8}
                  vectorEffect="non-scaling-stroke"
                  role="button"
                  tabIndex={0}
                  aria-label={`${province.name} ${province.stores.length} จุดขาย`}
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
                    opacity: selected ? 1 : 0.96,
                    transition: 'opacity 160ms ease, filter 160ms ease',
                    filter: selected ? 'brightness(1.08)' : undefined,
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {selectedProvince ? (
          <Box
            sx={{
              m: 2,
              mt: 0,
              p: 2,
              borderRadius: 3,
              bgcolor: '#FFFDF8',
              border: '3px solid #351129',
              boxShadow: '4px 5px 0 #351129',
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 1000 }}>
                  {selectedProvince.name}
                </Typography>
                <Typography sx={{ color: '#E5007E', fontSize: 13, fontWeight: 1000 }}>
                  {selectedProvince.stores.length
                    ? `พบ ${selectedProvince.stores.length} จุดขาย · ประมาณ ${selectedProvince.quantity.toLocaleString('th-TH')} กระป๋อง`
                    : 'ยังไม่มีข้อมูลจุดขาย Loveza'}
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
                        <Typography sx={{ color: '#6C5870', fontSize: 11 }}>
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
                แจ้งพิกัดแรก
              </Button>
            )}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
