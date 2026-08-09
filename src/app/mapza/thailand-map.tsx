'use client';

import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import type { Feature, Geometry, FeatureCollection, GeoJsonProperties } from 'geojson';
import type { MapzaStore } from 'src/types/store';

import { Layer, Source } from 'react-map-gl/maplibre';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { Map, MapPopup, MapControls } from 'src/components/map';

type ThailandMapProps = {
  stores: MapzaStore[];
  hasError?: boolean;
};

type ProvinceSummary = {
  id: string;
  name: string;
  quantity: number;
  geometry: Geometry;
  stores: MapzaStore[];
};

type SelectedProvince = ProvinceSummary & {
  latitude: number;
  longitude: number;
};

const PROVINCE_LAYER_ID = 'mapza-province-fill';
const THAILAND_CENTER = { latitude: 13.2, longitude: 101, zoom: 4.65 };
const MAPZA_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'mapza-background',
      type: 'background' as const,
      paint: { 'background-color': '#B9C8C5' },
    },
  ],
};

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

function isPointInRing(longitude: number, latitude: number, ring: number[][]) {
  let inside = false;

  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current) {
    const [currentLongitude, currentLatitude] = ring[current];
    const [previousLongitude, previousLatitude] = ring[previous];
    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointInPolygon(longitude: number, latitude: number, polygon: number[][][]) {
  if (!polygon[0] || !isPointInRing(longitude, latitude, polygon[0])) return false;

  return !polygon.slice(1).some((hole) => isPointInRing(longitude, latitude, hole));
}

function isStoreInGeometry(store: MapzaStore, geometry: Geometry) {
  if (geometry.type === 'Polygon') {
    return isPointInPolygon(store.longitude, store.latitude, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) =>
      isPointInPolygon(store.longitude, store.latitude, polygon)
    );
  }

  return false;
}

function collectGeometryPoints(value: unknown, points: number[][]) {
  if (!Array.isArray(value)) return;

  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    points.push(value as number[]);
    return;
  }

  value.forEach((item) => collectGeometryPoints(item, points));
}

function getProvinceCenter(geometry: Geometry) {
  const points: number[][] = [];
  collectGeometryPoints('coordinates' in geometry ? geometry.coordinates : [], points);

  if (!points.length)
    return { longitude: THAILAND_CENTER.longitude, latitude: THAILAND_CENTER.latitude };

  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);

  return {
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  };
}

function getProvinceName(feature: Feature<Geometry, GeoJsonProperties>) {
  const properties = feature.properties ?? {};
  const thaiName = String(properties.NL_NAME_1 ?? '')
    .replace(/^จังหวัด/, '')
    .trim();

  return thaiName || String(properties.NAME_1 ?? 'ไม่ทราบจังหวัด');
}

export default function ThailandMap({ stores, hasError = false }: ThailandMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [geoJson, setGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [mapError, setMapError] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<SelectedProvince | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/assets/data/thailand-provinces.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load Thailand GeoJSON');
        return response.json() as Promise<FeatureCollection<Geometry>>;
      })
      .then(setGeoJson)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setMapError(true);
      });

    return () => controller.abort();
  }, []);

  const { mapData, provinceSummaries } = useMemo(() => {
    if (!geoJson) return { mapData: null, provinceSummaries: [] as ProvinceSummary[] };

    const summaries: ProvinceSummary[] = [];
    const features = geoJson.features.map((feature, index) => {
      const provinceStores = stores.filter((store) => isStoreInGeometry(store, feature.geometry));
      const quantity = provinceStores.reduce(
        (total, store) => total + Math.max(store.estimated_quantity ?? 0, 0),
        0
      );
      const storeProvinceName = provinceStores.find((store) => store.province)?.province;
      const name = storeProvinceName || getProvinceName(feature);
      const id = String(feature.id ?? index);

      summaries.push({ id, name, quantity, geometry: feature.geometry, stores: provinceStores });

      return {
        ...feature,
        id,
        properties: {
          ...feature.properties,
          province_name: name,
          store_count: provinceStores.length,
          estimated_quantity: quantity,
        },
      };
    });

    return {
      mapData: { ...geoJson, features } satisfies FeatureCollection<Geometry>,
      provinceSummaries: summaries,
    };
  }, [geoJson, stores]);

  const activeProvinces = useMemo(
    () =>
      provinceSummaries
        .filter((province) => province.stores.length > 0)
        .sort((a, b) => b.stores.length - a.stores.length),
    [provinceSummaries]
  );

  const openProvince = useCallback((province: ProvinceSummary) => {
    const center = getProvinceCenter(province.geometry);
    setSelectedProvince({ ...province, ...center });
    mapRef.current?.flyTo({
      center: [center.longitude, center.latitude],
      zoom: 7.4,
      duration: 650,
    });
  }, []);

  const handleProvinceClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const featureId = event.features?.[0]?.id;
      const province = provinceSummaries.find((item) => item.id === String(featureId));
      if (!province) return;

      const { lng, lat } = event.lngLat;
      setSelectedProvince({ ...province, longitude: lng, latitude: lat });
    },
    [provinceSummaries]
  );

  if (mapError) {
    return <Alert severity="error">โหลดขอบเขตแผนที่ประเทศไทยไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>;
  }

  if (!mapData) {
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
            maxHeight: { xs: 400, lg: 610 },
          }}
        >
          {activeProvinces.map((province, index) => (
            <Box
              key={province.id}
              component="button"
              type="button"
              onClick={() => openProvince(province)}
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
                bgcolor: index % 3 === 0 ? '#FFF0F7' : index % 3 === 1 ? '#EFFCFF' : '#FFF8D8',
                border: '2px solid #351129',
                boxShadow: '3px 3px 0 #351129',
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
                  border: '2px solid #351129',
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
          boxShadow: '7px 8px 0 #351129',
        }}
      >
        <Map
          ref={mapRef}
          mapStyle={MAPZA_STYLE}
          initialViewState={THAILAND_CENTER}
          interactiveLayerIds={[PROVINCE_LAYER_ID]}
          onClick={handleProvinceClick}
          onMouseEnter={() => {
            if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'pointer';
          }}
          onMouseLeave={() => {
            if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
          }}
          sx={{ height: { xs: 600, md: 680 } }}
        >
          <MapControls hideGeolocate />

          <Source id="mapza-provinces" type="geojson" data={mapData}>
            <Layer
              id={PROVINCE_LAYER_ID}
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['==', ['get', 'store_count'], 0],
                  '#8F9B9C',
                  [
                    'interpolate',
                    ['linear'],
                    ['get', 'store_count'],
                    1,
                    '#70E1F5',
                    3,
                    '#FDE047',
                    7,
                    '#FF78B8',
                    15,
                    '#E5007E',
                  ],
                ],
                'fill-opacity': 0.96,
              }}
            />
            <Layer
              id="mapza-province-outline"
              type="line"
              paint={{ 'line-color': '#FFFFFF', 'line-width': 1.35, 'line-opacity': 0.95 }}
            />
          </Source>

          <Box
            sx={{
              top: 14,
              left: 14,
              zIndex: 1,
              p: 1.2,
              gap: 1,
              display: 'flex',
              position: 'absolute',
              flexDirection: 'column',
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,.94)',
              border: '2px solid #351129',
              boxShadow: '3px 3px 0 #351129',
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 1000 }}>สถานะจังหวัด</Typography>
            <Typography
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
                sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#E5007E' }}
              />
              มีจุดขาย Loveza
            </Typography>
            <Typography
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
                sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#8F9B9C' }}
              />
              ยังไม่มีข้อมูล
            </Typography>
          </Box>

          {selectedProvince ? (
            <MapPopup
              longitude={selectedProvince.longitude}
              latitude={selectedProvince.latitude}
              onClose={() => setSelectedProvince(null)}
              closeOnClick={false}
              maxWidth="310px"
            >
              <Box
                sx={{
                  minWidth: 230,
                  p: 1,
                  borderTop: `5px solid ${selectedProvince.stores.length ? '#E5007E' : '#8F9B9C'}`,
                }}
              >
                <Typography sx={{ pr: 2, fontSize: 18, fontWeight: 1000 }}>
                  {selectedProvince.name}
                </Typography>
                {selectedProvince.stores.length ? (
                  <>
                    <Typography sx={{ mt: 0.75, color: '#E5007E', fontSize: 13, fontWeight: 1000 }}>
                      พบ {selectedProvince.stores.length} จุดขาย · ประมาณ{' '}
                      {selectedProvince.quantity.toLocaleString('th-TH')} กระป๋อง
                    </Typography>
                    <Typography sx={{ mt: 1, color: '#6C5870', fontSize: 12, fontWeight: 700 }}>
                      {selectedProvince.stores
                        .slice(0, 3)
                        .map((store) => store.name)
                        .join(' · ')}
                    </Typography>
                    <Button
                      component="a"
                      href={buildGoogleMapsUrl(
                        selectedProvince.latitude,
                        selectedProvince.longitude
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      startIcon={<Iconify icon="ri:map-pin-range-fill" />}
                      sx={{ mt: 1, px: 0, fontWeight: 900 }}
                    >
                      เปิดพื้นที่ใน Google Maps
                    </Button>
                  </>
                ) : (
                  <Typography sx={{ mt: 0.75, color: '#64706F', fontSize: 13, fontWeight: 800 }}>
                    จังหวัดนี้ยังไม่มีข้อมูลจุดขาย Loveza
                  </Typography>
                )}
              </Box>
            </MapPopup>
          ) : null}
        </Map>
      </Box>
    </Box>
  );
}
