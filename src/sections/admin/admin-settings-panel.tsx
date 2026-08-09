'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import {
  formatRadiusM,
  MAX_SEARCH_RADIUS_M,
  MIN_SEARCH_RADIUS_M,
  MAX_DUPLICATE_RADIUS_M,
  MIN_DUPLICATE_RADIUS_M,
  SEARCH_RADIUS_OPTIONS_M,
  DUPLICATE_RADIUS_OPTIONS_M,
} from 'src/lib/admin/duplicate-radius';

import { Iconify } from 'src/components/iconify';

type AdminSettingsPanelProps = {
  initialDuplicateRadiusM: number;
  initialSearchRadiusM: number;
  updatedAt: string | null;
  hasError?: boolean;
};

function getClosestOptionIndex(options: readonly number[], value: number) {
  return options.reduce(
    (closestIndex, option, index) =>
      Math.abs(option - value) < Math.abs(options[closestIndex] - value) ? index : closestIndex,
    0
  );
}

type RadiusFieldProps = {
  icon: string;
  title: string;
  description: string;
  radiusM: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  options: readonly number[];
  marks: { value: number; label: string }[];
  textLabel: string;
  helperText: string;
};

function RadiusField({
  icon,
  title,
  description,
  radiusM,
  onChange,
  min,
  max,
  options,
  marks,
  textLabel,
  helperText,
}: RadiusFieldProps) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            color: '#E5007E',
            display: 'grid',
            flexShrink: 0,
            borderRadius: 2.5,
            placeItems: 'center',
            bgcolor: 'rgba(239,35,130,.10)',
          }}
        >
          <Iconify icon={icon} width={28} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{title}</Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ px: { xs: 1, sm: 2 } }}>
        <Slider
          value={getClosestOptionIndex(options, radiusM)}
          min={0}
          max={options.length - 1}
          step={1}
          marks={marks}
          valueLabelDisplay="on"
          valueLabelFormat={(index) => formatRadiusM(options[index] ?? min)}
          onChange={(_event, value) => onChange(options[value as number] ?? min)}
          aria-label={textLabel}
        />
      </Box>

      <TextField
        fullWidth
        type="number"
        label={textLabel}
        value={radiusM}
        onChange={(event) => onChange(Number(event.target.value || min))}
        slotProps={{ htmlInput: { min, max, step: 10 } }}
        helperText={helperText}
      />
    </Stack>
  );
}

export function AdminSettingsPanel({
  initialDuplicateRadiusM,
  initialSearchRadiusM,
  updatedAt,
  hasError = false,
}: AdminSettingsPanelProps) {
  const [duplicateRadiusM, setDuplicateRadiusM] = useState(initialDuplicateRadiusM);
  const [searchRadiusM, setSearchRadiusM] = useState(initialSearchRadiusM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(updatedAt);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDuplicateRadiusChange = (value: number) => {
    setDuplicateRadiusM(
      Math.min(MAX_DUPLICATE_RADIUS_M, Math.max(MIN_DUPLICATE_RADIUS_M, Math.round(value)))
    );
    setMessage(null);
  };

  const handleSearchRadiusChange = (value: number) => {
    setSearchRadiusM(
      Math.min(MAX_SEARCH_RADIUS_M, Math.max(MIN_SEARCH_RADIUS_M, Math.round(value)))
    );
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateRadiusM, searchRadiusM }),
      });
      const payload = (await response.json()) as {
        error?: string;
        settings?: { duplicateRadiusM: number; searchRadiusM: number; updatedAt: string };
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }

      setDuplicateRadiusM(payload.settings.duplicateRadiusM);
      setSearchRadiusM(payload.settings.searchRadiusM);
      setLastUpdatedAt(payload.settings.updatedAt);
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าระยะเรียบร้อยแล้ว' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'บันทึกการตั้งค่าไม่สำเร็จ',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
          ตั้งค่าระบบ
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
          กำหนดกติกาการรับพิกัดจากผู้ใช้งานทุกคน
        </Typography>
      </Box>

      {hasError ? (
        <Alert severity="error">
          โหลดการตั้งค่าไม่สำเร็จ กรุณาตรวจสอบว่าได้รัน migration ล่าสุดแล้ว
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={4}>
          <RadiusField
            icon="ri:radar-fill"
            title="ระยะตรวจร้านซ้ำ"
            description="ใช้ป้องกันการแจ้งพิกัดร้านซ้ำตอนส่งรายงาน"
            radiusM={duplicateRadiusM}
            onChange={handleDuplicateRadiusChange}
            min={MIN_DUPLICATE_RADIUS_M}
            max={MAX_DUPLICATE_RADIUS_M}
            options={DUPLICATE_RADIUS_OPTIONS_M}
            marks={[
              { value: 0, label: '10 ม.' },
              { value: 4, label: '100 ม.' },
              { value: 7, label: '1 กม.' },
              { value: 9, label: '5 กม.' },
              { value: 11, label: '15 กม.' },
            ]}
            textLabel="ระยะตรวจซ้ำ (เมตร)"
            helperText="ปรับได้ตั้งแต่ 10 เมตร–15 กิโลเมตร (1,000 เมตร = 1 กม.) ค่าเริ่มต้นคือ 75 เมตร"
          />

          <Divider />

          <RadiusField
            icon="ri:map-pin-user-fill"
            title="ระยะค้นหาร้านใกล้ฉัน"
            description="กำหนดระยะค้นหาร้านในหน้า Loveza ใกล้ฉัน"
            radiusM={searchRadiusM}
            onChange={handleSearchRadiusChange}
            min={MIN_SEARCH_RADIUS_M}
            max={MAX_SEARCH_RADIUS_M}
            options={SEARCH_RADIUS_OPTIONS_M}
            marks={[
              { value: 0, label: '500 ม.' },
              { value: 4, label: '5 กม.' },
              { value: 6, label: '20 กม.' },
              { value: 8, label: '50 กม.' },
            ]}
            textLabel="ระยะค้นหา (เมตร)"
            helperText="ปรับได้ตั้งแต่ 500 เมตร–50 กิโลเมตร ค่าเริ่มต้นคือ 5 กิโลเมตร"
          />

          {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              {lastUpdatedAt
                ? `แก้ไขล่าสุด ${new Date(lastUpdatedAt).toLocaleString('th-TH')}`
                : 'ยังไม่มีประวัติการแก้ไข'}
            </Typography>
            <Button
              variant="contained"
              disabled={saving || hasError}
              onClick={handleSave}
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Iconify icon="ri:save-3-fill" />
                )
              }
              sx={{ minWidth: 150, borderRadius: 99 }}
            >
              {saving ? 'กำลังบันทึก' : 'บันทึกการตั้งค่า'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
