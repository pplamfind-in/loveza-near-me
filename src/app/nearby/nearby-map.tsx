'use client';

import type { MapRef } from 'react-map-gl/maplibre';
import type { Coordinates, NearbyStore, StoreStatus } from 'src/types/store';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { Map, MapPopup, MapMarker, MAP_STYLES, MapControls } from 'src/components/map';

import { STORE_STATUS_LABEL } from 'src/types/store';

import { LOVEZA_STORE_COLORS, getNearbyStoreColor } from './nearby-colors';

type SortedNearbyStore = NearbyStore & { distanceKm: number };

type NearbyMapProps = {
  coordinates: Coordinates;
  stores: SortedNearbyStore[];
};

const STATUS_COLOR: Record<StoreStatus, string> = {
  available: '#19a76f',
  low_stock: '#f29b18',
  out_of_stock: '#e64b55',
  unknown: 'var(--palette-grey-500)',
};

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function NearbyMap({ coordinates, stores }: NearbyMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<SortedNearbyStore | null>(null);

  const selectStore = useCallback((store: SortedNearbyStore) => {
    setSelectedStore(store);

    const map = mapRef.current;
    if (!map) return;

    const mapHeight = map.getContainer().clientHeight;
    const verticalOffset = Math.min(160, mapHeight * 0.32);

    map.easeTo({
      center: [store.longitude, store.latitude],
      offset: [0, verticalOffset],
      duration: 420,
      essential: true,
    });
  }, []);

  const fitMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = [
      [coordinates.longitude, coordinates.latitude] as [number, number],
      ...stores.map((store) => [store.longitude, store.latitude] as [number, number]),
    ];

    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 14, duration: 600 });
      return;
    }

    const longitudes = points.map(([longitude]) => longitude);
    const latitudes = points.map(([, latitude]) => latitude);

    map.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      { padding: 64, maxZoom: 15, duration: 600 }
    );
  }, [coordinates, stores]);

  useEffect(() => {
    fitMarkers();
  }, [fitMarkers]);

  useEffect(() => {
    setSelectedStore((current) => {
      if (!current) return null;
      return stores.find((store) => store.id === current.id) ?? null;
    });
  }, [stores]);

  const mapContent = (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLES.neutral}
      initialViewState={{
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        zoom: 14,
      }}
      onLoad={fitMarkers}
      onClick={() => setSelectedStore(null)}
      sx={{
        height: fullscreen ? '100%' : { xs: 'clamp(320px, 52dvh, 420px)', sm: 420, md: 480 },
        border: 0,
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      <MapControls hideGeolocate hideFullscreen />
      <Button
        variant="contained"
        onClick={(event) => {
          event.stopPropagation();
          setFullscreen((current) => !current);
        }}
        startIcon={
          <Iconify
            icon={fullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'}
            width={18}
          />
        }
        aria-label={fullscreen ? 'ออกจากแผนที่เต็มจอ' : 'ดูแผนที่เต็มจอ'}
        sx={{
          position: 'absolute',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 12,
          zIndex: 2,
          minHeight: 36,
          px: 1.5,
          borderRadius: '10px',
          fontSize: 12,
          bgcolor: 'background.paper',
          color: 'primary.dark',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(35,63,43,.1)',
          '&:hover': { bgcolor: 'primary.lighter' },
        }}
      >
        {fullscreen ? 'ออกจากเต็มจอ' : 'ดูเต็มจอ'}
      </Button>

      <Paper
        elevation={0}
        sx={{
          top: {
            xs: 'calc(max(12px, env(safe-area-inset-top)) + 44px)',
            sm: 'max(12px, env(safe-area-inset-top))',
          },
          right: 12,
          zIndex: 1,
          px: 1.5,
          py: 1,
          display: 'flex',
          gap: 1.5,
          position: 'absolute',
          border: '1px solid var(--palette-grey-300)',
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,.92)',
          boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
        }}
      >
        <Typography
          component="div"
          sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontSize: 11, fontWeight: 800 }}
        >
          <Box
            component="span"
            sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#1687ff' }}
          />
          คุณ
        </Typography>
        <Typography
          component="div"
          sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 11, fontWeight: 800 }}
        >
          <Box component="span" sx={{ display: 'flex' }}>
            {LOVEZA_STORE_COLORS.slice(0, 3).map((color, index) => (
              <Box
                key={color.main}
                component="span"
                sx={{
                  width: 9,
                  height: 9,
                  ml: index ? '-2px' : 0,
                  border: '1px solid var(--palette-background-paper)',
                  borderRadius: '50%',
                  bgcolor: color.main,
                }}
              />
            ))}
          </Box>
          ร้าน Loveza
        </Typography>
      </Paper>

      <MapMarker
        latitude={coordinates.latitude}
        longitude={coordinates.longitude}
        anchor="center"
        aria-label="ตำแหน่งปัจจุบันของคุณ"
      >
        <Box
          role="img"
          aria-label="นักสำรวจ ตำแหน่งปัจจุบันของคุณ"
          sx={{
            width: 48,
            height: 48,
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            borderRadius: '50%',
            bgcolor: '#E8DDF8',
            border: '3px solid var(--palette-common-white)',
            boxShadow: '0 4px 14px rgba(75,55,105,.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -7,
              border: '2px solid rgba(160,131,193,.24)',
              borderRadius: '50%',
              animation: 'loveza-location-pulse 2.4s ease-out infinite',
            },
            '@media (prefers-reduced-motion: reduce)': { '&::before': { animation: 'none' } },
            '@keyframes loveza-location-pulse': {
              '0%': { opacity: 0.7, transform: 'scale(.85)' },
              '80%, 100%': { opacity: 0, transform: 'scale(1.3)' },
            },
          }}
        >
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              width: 1,
              height: 1,
              position: 'relative',
              borderRadius: '50%',
              backgroundImage: 'url(/assets/loveza/nearby-explorer-v1.webp)',
              backgroundSize: '230px auto',
              backgroundPosition: '89% 49%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </Box>
      </MapMarker>

      {stores.map((store) => {
        const storeColor = getNearbyStoreColor(store.id);
        const selected = selectedStore?.id === store.id;

        return (
          <MapMarker
            key={store.id}
            latitude={store.latitude}
            longitude={store.longitude}
            anchor="bottom"
            sx={{ zIndex: selected ? 2 : 1 }}
          >
            <Box
              component="button"
              type="button"
              aria-label={`ดูรายละเอียดร้าน ${store.name}`}
              aria-pressed={selected}
              title={store.name}
              onClick={(event) => {
                event.stopPropagation();
                selectStore(store);
              }}
              sx={{
                position: 'relative',
                display: 'block',
                p: 0,
                pb: '14px',
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                transform: selected ? 'translateY(-5px)' : 'none',
                transition: 'transform 180ms ease',
                '&:hover': { transform: 'translateY(-5px)' },
                '&:focus-visible': {
                  outline: '3px solid var(--palette-primary-main)',
                  outlineOffset: 4,
                  borderRadius: '20px',
                },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: { xs: 68, sm: 80 },
                  height: { xs: 76, sm: 88 },
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  border: '3px solid var(--palette-common-white)',
                  borderRadius: '20px',
                  bgcolor: storeColor.soft,
                  boxShadow: selected
                    ? `0 0 0 2px ${storeColor.main}, 0 10px 24px rgba(35,45,30,.22)`
                    : '0 6px 18px rgba(35,45,30,.18)',
                }}
              >
                {store.store_type_logo_url ? (
                  <Box
                    component="img"
                    src={store.store_type_logo_url}
                    alt=""
                    sx={{ width: '76%', height: '76%', p: 0.5, objectFit: 'contain' }}
                  />
                ) : (
                  <Box
                    sx={{
                      color: storeColor.dark,
                      display: 'grid',
                      justifyItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Iconify icon="ri:store-2-fill" width={30} />
                    <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
                      LOVEZA
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    width: 17,
                    height: 17,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'common.white',
                    borderRadius: '50%',
                    boxShadow: '0 1px 4px rgba(0,0,0,.1)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: STATUS_COLOR[store.current_status],
                    }}
                  />
                </Box>
              </Box>
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 23,
                  height: 23,
                  borderRadius: '50%',
                  bgcolor: storeColor.main,
                  border: '3px solid var(--palette-common-white)',
                  boxShadow: '0 3px 8px rgba(35,45,30,.16)',
                }}
              />
            </Box>
          </MapMarker>
        );
      })}

      {selectedStore ? (
        <MapPopup
          longitude={selectedStore.longitude}
          latitude={selectedStore.latitude}
          onClose={() => setSelectedStore(null)}
          closeOnClick={false}
          offset={50}
          maxWidth="min(280px, calc(100vw - 32px))"
          sx={{
            '& .maplibregl-popup-content': {
              width: 'min(280px, calc(100vw - 32px))',
              maxWidth: 'none',
            },
          }}
        >
          <Box
            sx={{
              width: 1,
              minWidth: 0,
              p: 0.75,
              boxSizing: 'border-box',
              // borderTop: `4px solid ${getNearbyStoreColor(selectedStore.id).main}`,
            }}
          >
            <Typography sx={{ pr: 2, fontSize: 16, fontWeight: 900 }}>
              {selectedStore.name}
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 12 }}>
              {[selectedStore.address, selectedStore.province].filter(Boolean).join(', ')}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: STATUS_COLOR[selectedStore.current_status],
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {STORE_STATUS_LABEL[selectedStore.current_status] ?? STORE_STATUS_LABEL.unknown}
              {selectedStore.estimated_quantity !== null
                ? ` · ประมาณ ${selectedStore.estimated_quantity} กระป๋อง`
                : ''}
            </Typography>
            <Typography
              sx={{ mt: 0.5, color: 'var(--palette-primary-main)', fontSize: 12, fontWeight: 800 }}
            >
              ห่างจากคุณ {selectedStore.distanceKm.toFixed(1)} กม.
            </Typography>
            <Button
              component="a"
              href={buildGoogleMapsUrl(selectedStore.latitude, selectedStore.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<Iconify icon="ri:route-fill" />}
              sx={{ mt: 1, px: 2 }}
            >
              นำทางไปที่ร้าน
            </Button>
          </Box>
        </MapPopup>
      ) : null}
    </Map>
  );

  return fullscreen ? (
    <Dialog
      open
      fullScreen
      onClose={() => setFullscreen(false)}
      aria-label="แผนที่ร้านใกล้ฉันแบบเต็มจอ"
      slotProps={{
        paper: { sx: { m: 0, border: 0, borderRadius: 0, height: '100dvh', overflow: 'hidden' } },
      }}
    >
      {mapContent}
    </Dialog>
  ) : (
    mapContent
  );
}
