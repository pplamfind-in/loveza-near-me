'use client';

import type { MapRef } from 'react-map-gl/maplibre';
import type { Coordinates, NearbyStore, StoreStatus } from 'src/types/store';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
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
  unknown: '#7b4aa0',
};

const buildGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function NearbyMap({ coordinates, stores }: NearbyMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedStore, setSelectedStore] = useState<SortedNearbyStore | null>(null);

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

  return (
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
        height: { xs: 420, md: 560 },
        border: '3px solid #351129',
        borderRadius: 4,
        boxShadow: '7px 8px 0 #351129',
      }}
    >
      <MapControls hideGeolocate />

      <Paper
        elevation={0}
        sx={{
          top: 12,
          right: 12,
          zIndex: 1,
          px: 1.5,
          py: 1,
          display: 'flex',
          gap: 1.5,
          position: 'absolute',
          border: '2px solid #351129',
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,.92)',
          boxShadow: '3px 3px 0 #351129',
        }}
      >
        <Typography
          sx={{ display: 'flex', gap: 0.5, alignItems: 'center', fontSize: 11, fontWeight: 800 }}
        >
          <Box
            component="span"
            sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#1687ff' }}
          />
          คุณ
        </Typography>
        <Typography
          sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 11, fontWeight: 800 }}
        >
          <Box sx={{ display: 'flex' }}>
            {LOVEZA_STORE_COLORS.slice(0, 3).map((color, index) => (
              <Box
                key={color.main}
                component="span"
                sx={{
                  width: 9,
                  height: 9,
                  ml: index ? '-2px' : 0,
                  border: '1px solid #fff',
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
        aria-label="ตำแหน่งปัจจุบันของคุณ"
        sx={{
          width: 40,
          height: 40,
          color: '#1687ff',
          filter: 'drop-shadow(0 4px 8px rgba(22,135,255,.45))',
        }}
      />

      {stores.map((store) => {
        const storeColor = getNearbyStoreColor(store.id);

        return (
          <MapMarker
            key={store.id}
            latitude={store.latitude}
            longitude={store.longitude}
            aria-label={`ร้าน ${store.name}`}
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelectedStore(store);
            }}
            sx={{
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: storeColor.main,
              filter: `drop-shadow(0 5px 8px ${storeColor.main}66)`,
              transition: 'transform .2s ease',
              '&:hover': { transform: 'translateY(-3px) scale(1.12)' },
            }}
          />
        );
      })}

      {selectedStore ? (
        <MapPopup
          longitude={selectedStore.longitude}
          latitude={selectedStore.latitude}
          onClose={() => setSelectedStore(null)}
          closeOnClick={false}
          maxWidth="280px"
        >
          <Box
            sx={{
              minWidth: 210,
              p: 0.75,
              borderTop: `4px solid ${getNearbyStoreColor(selectedStore.id).main}`,
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
            <Typography sx={{ mt: 0.5, color: '#E5007E', fontSize: 12, fontWeight: 800 }}>
              ห่างจากคุณ {selectedStore.distanceKm.toFixed(1)} กม.
            </Typography>
            <Button
              component="a"
              href={buildGoogleMapsUrl(selectedStore.latitude, selectedStore.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<Iconify icon="ri:route-fill" />}
              sx={{ mt: 1, px: 0 }}
            >
              นำทางไปที่ร้าน
            </Button>
          </Box>
        </MapPopup>
      ) : null}
    </Map>
  );
}
