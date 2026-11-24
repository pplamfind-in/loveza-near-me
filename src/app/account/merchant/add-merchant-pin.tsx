'use client';

import type { MapRef } from 'react-map-gl/maplibre';
import type { Coordinates } from 'src/types/store';

import { useRef, useState, useEffect, useTransition } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { useReportStoreCandidates } from 'src/app/report/use-report-store-candidates';

import { Map, MapMarker, MAP_STYLES } from 'src/components/map';

import { saveMerchantPin, submitExistingMerchantPin } from './actions';

type SavedPin = Coordinates & { id: string; name: string };

function StorePinLogo({ logoUrl, size }: { logoUrl: string | null; size: number }) {
  return (
    <Avatar
      component="span"
      src={logoUrl ?? undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        bgcolor: 'background.paper',
        '& img': { objectFit: 'contain' },
      }}
    >
      <Box
        component="img"
        src="/assets/icons/loveza/voxel-store.svg"
        alt=""
        sx={{ width: '70%' }}
      />
    </Avatar>
  );
}

function PinPicker({ onClose, savedPins }: { onClose: () => void; savedPins: SavedPin[] }) {
  const map = useRef<MapRef | null>(null);
  const [pin, setPin] = useState<Coordinates | null>(null);
  const [selectedPinId, setSelectedPinId] = useState('');
  const [message, setMessage] = useState<{
    text: string;
    severity: 'success' | 'warning' | 'error';
    canAddNearby?: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const gps = useGeolocation();
  const selected = pin ?? gps.coordinates;
  const nearby = useReportStoreCandidates(selected?.latitude, selected?.longitude);
  const nearbyPins = (nearby.data ?? []).flatMap((candidate) =>
    candidate.latitude === null || candidate.longitude === null
      ? []
      : [
          {
            id: candidate.storeId,
            name: candidate.storeName,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            distanceM: candidate.distanceM,
            logoUrl: candidate.logoUrl,
          },
        ]
  );
  const selectedNearbyPin = nearbyPins.find(({ id }) => id === selectedPinId);
  const selectedLocation = selectedNearbyPin ?? selected;

  useEffect(() => {
    if (gps.coordinates) {
      map.current?.easeTo({
        center: [gps.coordinates.longitude, gps.coordinates.latitude],
        zoom: 16,
      });
    }
  }, [gps.coordinates]);

  return (
    <>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            แตะตำแหน่งร้านบนแผนที่ หรือใช้ตำแหน่งปัจจุบัน
          </Typography>
          <Button
            variant="outlined"
            loading={gps.isLoading}
            disabled={pending}
            onClick={() => {
              setPin(null);
              setSelectedPinId('');
              setMessage(null);
              gps.requestLocation();
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            ใช้ตำแหน่งปัจจุบัน
          </Button>
          {savedPins.length > 0 && (
            <TextField
              select
              label="เลือกหมุดเดิมของร้าน"
              value={selectedPinId}
              disabled={pending}
              onChange={(event) => {
                const option = savedPins.find(({ id }) => id === event.target.value);
                setSelectedPinId(option?.id ?? '');
                setPin(option ?? null);
                setMessage(null);
                if (option) {
                  map.current?.easeTo({ center: [option.longitude, option.latitude], zoom: 16 });
                }
              }}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">เลือกตำแหน่งเอง</option>
              {savedPins.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </TextField>
          )}
          <Map
            ref={map}
            mapStyle={MAP_STYLES.neutral}
            initialViewState={{ latitude: 13.7563, longitude: 100.5018, zoom: 5 }}
            onClick={({ lngLat }) => {
              if (pending) return;
              setPin({ latitude: lngLat.lat, longitude: lngLat.lng });
              setSelectedPinId('');
              setMessage(null);
            }}
            sx={{ height: { xs: 320, sm: 410 }, borderRadius: 2 }}
          >
            {selected && !selectedNearbyPin && <MapMarker {...selected} anchor="bottom" />}
            {nearbyPins.map((nearbyPin) => (
              <MapMarker
                key={nearbyPin.id}
                latitude={nearbyPin.latitude}
                longitude={nearbyPin.longitude}
                anchor="bottom"
              >
                <Button
                  size="small"
                  aria-label={nearbyPin.name}
                  aria-pressed={selectedPinId === nearbyPin.id}
                  variant={selectedPinId === nearbyPin.id ? 'contained' : 'outlined'}
                  sx={{
                    minWidth: 39,
                    minHeight: 39,
                    p: 0.25,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: selectedPinId === nearbyPin.id ? 'primary.main' : 'common.white',
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (pending) return;
                    setSelectedPinId(nearbyPin.id);
                    setMessage(null);
                  }}
                >
                  <StorePinLogo logoUrl={nearbyPin.logoUrl} size={31} />
                </Button>
              </MapMarker>
            ))}
          </Map>
          {selectedLocation && (
            <Typography variant="body2" color="text.secondary">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Typography>
          )}
          {nearbyPins.length > 0 && (
            <Stack spacing={0.75}>
              <Typography variant="subtitle2">หมุดร้านใกล้เคียง</Typography>
              {nearbyPins.map((nearbyPin) => (
                <Button
                  key={nearbyPin.id}
                  variant={selectedPinId === nearbyPin.id ? 'contained' : 'outlined'}
                  aria-pressed={selectedPinId === nearbyPin.id}
                  disabled={pending}
                  onClick={() => {
                    setSelectedPinId(nearbyPin.id);
                    setMessage(null);
                    map.current?.easeTo({ center: [nearbyPin.longitude, nearbyPin.latitude] });
                  }}
                  sx={{ justifyContent: 'space-between', gap: 1, textAlign: 'left' }}
                >
                  <Stack component="span" direction="row" alignItems="center" gap={1}>
                    <StorePinLogo logoUrl={nearbyPin.logoUrl} size={28} />
                    <span>{nearbyPin.name}</span>
                  </Stack>
                  <span>{nearbyPin.distanceM} ม.</span>
                </Button>
              ))}
              {selectedNearbyPin && !savedPins.some(({ id }) => id === selectedPinId) && (
                <Typography variant="caption" color="text.secondary">
                  ถ้าเป็นร้านของคุณ เลือกหมุดนี้เพื่อส่งคำขอสิทธิ์ให้ทีมงาน
                </Typography>
              )}
            </Stack>
          )}
          {gps.error && !pin && <Alert severity="warning">{gps.error}</Alert>}
          {message && <Alert severity={message.severity}>{message.text}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={!selectedLocation || gps.isLoading || message?.severity === 'success'}
          loading={pending}
          onClick={() => {
            if (!selectedLocation) return;
            startTransition(async () => {
              try {
                const result = selectedPinId
                  ? await submitExistingMerchantPin(selectedPinId)
                  : await saveMerchantPin({
                      ...selectedLocation,
                      allowNearby: message?.canAddNearby === true,
                    });
                if (result.error) {
                  setMessage({
                    text: result.error,
                    severity: 'warning' in result && result.warning ? 'warning' : 'error',
                    canAddNearby: !selectedPinId && 'canAddNearby' in result && result.canAddNearby === true,
                  });
                } else if ('requested' in result && result.requested) {
                  setMessage({ text: 'ส่งคำขอสิทธิ์หมุดนี้ให้ทีมงานแล้ว', severity: 'success' });
                } else {
                  onClose();
                  document.getElementById('merchant-stock')?.scrollIntoView({ block: 'start' });
                }
              } catch {
                setMessage({ text: 'บันทึกหมุดไม่สำเร็จ กรุณาลองอีกครั้ง', severity: 'error' });
              }
            });
          }}
        >
          {selectedPinId
            ? 'ใช้หมุดที่เลือก'
            : message?.canAddNearby
              ? 'ยืนยันว่าเป็นคนละร้าน'
              : 'บันทึกหมุด'}
        </Button>
      </DialogActions>
    </>
  );
}

export function AddMerchantPin({ ready, savedPins }: { ready: boolean; savedPins: SavedPin[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        disabled={!ready}
        variant="contained"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        เพิ่มหมุดร้านค้า
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="merchant-pin-title"
      >
        <DialogTitle id="merchant-pin-title">ปักหมุดร้านของฉัน</DialogTitle>
        {open && <PinPicker onClose={() => setOpen(false)} savedPins={savedPins} />}
      </Dialog>
    </>
  );
}
