'use client';

import type { Store } from 'src/types/store';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import MapRounded from '@mui/icons-material/MapRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import RemoveCircleOutlineRounded from '@mui/icons-material/RemoveCircleOutlineRounded';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { formatDistance } from 'src/utils/format-distance';
import { getGoogleMapsUrl } from 'src/utils/google-maps-url';
import { calculateDistance } from 'src/utils/calculate-distance';

import { createClient } from 'src/lib/supabase/client';
import { createQuickStatusReport } from 'src/services/reports.service';

// ----------------------------------------------------------------------

type StoreQuickActionsProps = {
  store: Store;
};

export function StoreQuickActions({ store }: StoreQuickActionsProps) {
  const geolocation = useGeolocation();
  const [pendingStatus, setPendingStatus] = useState<'available' | 'out_of_stock' | null>(null);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    geolocation.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const distanceKm = geolocation.coordinates
    ? calculateDistance(geolocation.coordinates, {
        latitude: store.latitude,
        longitude: store.longitude,
      })
    : null;

  async function handleQuickStatus(status: 'available' | 'out_of_stock') {
    setPendingStatus(status);

    try {
      const supabase = createClient();
      await createQuickStatusReport(supabase, store, status);
      setFeedback({ severity: 'success', message: 'ขอบคุณที่ช่วยแจ้งข้อมูลล่าสุด' });
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'แจ้งข้อมูลไม่สำเร็จ กรุณาลองใหม่',
      });
    } finally {
      setPendingStatus(null);
    }
  }

  const reportQuery = new URLSearchParams({
    storeName: store.name,
    province: store.province,
    district: store.district ?? '',
    subdistrict: store.subdistrict ?? '',
    latitude: String(store.latitude),
    longitude: String(store.longitude),
  }).toString();

  return (
    <Stack spacing={1.5}>
      {distanceKm !== null && (
        <Typography variant="body2" color="text.secondary">
          {formatDistance(distanceKm)}
        </Typography>
      )}

      <Button
        href={getGoogleMapsUrl(store.latitude, store.longitude)}
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        size="large"
        startIcon={<MapRounded />}
        fullWidth
      >
        เปิดใน Google Maps
      </Button>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="outlined"
          color="success"
          startIcon={<CheckCircleOutlineRounded />}
          onClick={() => handleQuickStatus('available')}
          loading={pendingStatus === 'available'}
          disabled={pendingStatus !== null}
          fullWidth
        >
          ยังมีสินค้า
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RemoveCircleOutlineRounded />}
          onClick={() => handleQuickStatus('out_of_stock')}
          loading={pendingStatus === 'out_of_stock'}
          disabled={pendingStatus !== null}
          fullWidth
        >
          สินค้าหมด
        </Button>
      </Stack>

      <Button href={`/report?${reportQuery}`} variant="text" fullWidth>
        แจ้งข้อมูลล่าสุด
      </Button>

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : undefined}
      </Snackbar>
    </Stack>
  );
}
