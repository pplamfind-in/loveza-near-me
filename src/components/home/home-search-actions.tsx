'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MyLocationRounded from '@mui/icons-material/MyLocationRounded';
import AddLocationAltRounded from '@mui/icons-material/AddLocationAltRounded';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { THAI_PROVINCES } from 'src/data/thai-provinces';

// ----------------------------------------------------------------------

export function HomeSearchActions() {
  const router = useRouter();
  const geolocation = useGeolocation();
  const [showFallback, setShowFallback] = useState(false);
  const [province, setProvince] = useState('');

  useEffect(() => {
    if (geolocation.coordinates) {
      router.push('/nearby');
    }
  }, [geolocation.coordinates, router]);

  useEffect(() => {
    if (geolocation.error) setShowFallback(true);
  }, [geolocation.error]);

  return (
    <Stack spacing={1.5}>
      <Button
        size="large"
        variant="contained"
        fullWidth
        loading={geolocation.isLoading}
        startIcon={<MyLocationRounded />}
        onClick={geolocation.requestLocation}
      >
        ค้นหาใกล้ฉัน
      </Button>

      <Button
        size="large"
        variant="outlined"
        fullWidth
        href="/report"
        startIcon={<AddLocationAltRounded />}
      >
        เจอ Loveza แจ้งพิกัด
      </Button>

      {showFallback && (
        <Stack spacing={1.5} sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            {geolocation.error}
          </Typography>
          <TextField
            select
            label="เลือกจังหวัดเพื่อค้นหาแทน"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            fullWidth
          >
            {THAI_PROVINCES.map((item) => (
              <MenuItem key={item.code} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            disabled={!province}
            onClick={() => router.push(`/nearby?province=${encodeURIComponent(province)}`)}
          >
            ค้นหา
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
