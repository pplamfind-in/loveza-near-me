'use client';

import type { ProvinceColorSettings } from 'src/lib/mapza/province-color-scale';

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
  buildProvinceColorScale,
  isValidProvinceColorSettings,
} from 'src/lib/mapza/province-color-scale';
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
  initialProvinceColorSettings: ProvinceColorSettings;
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

type ProvinceColorFieldProps = {
  settings: ProvinceColorSettings;
  onChange: (settings: ProvinceColorSettings) => void;
};

function ProvinceColorField({ settings, onChange }: ProvinceColorFieldProps) {
  const scale = buildProvinceColorScale(settings);
  const rows = [
    { ...scale[0], colorKey: 'noDataColor', countKey: null, countLabel: 'จำนวนคงที่', count: 0 },
    {
      ...scale[1],
      colorKey: 'tier1Color',
      countKey: 'tier1Max',
      countLabel: 'จำนวนสูงสุด',
      count: settings.tier1Max,
    },
    {
      ...scale[2],
      colorKey: 'tier2Color',
      countKey: 'tier2Max',
      countLabel: 'จำนวนสูงสุด',
      count: settings.tier2Max,
    },
    {
      ...scale[3],
      colorKey: 'tier3Color',
      countKey: 'tier3Max',
      countLabel: 'จำนวนสูงสุด',
      count: settings.tier3Max,
    },
    {
      ...scale[4],
      colorKey: 'tier4Color',
      countKey: null,
      countLabel: 'เริ่มต้นที่',
      count: settings.tier3Max + 1,
    },
  ] as const;

  return (
    <Stack spacing={2.5}>
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
          <Iconify icon="ri:palette-fill" width={28} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 900 }}>สีสถานะจังหวัด</Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
            กำหนดช่วงจำนวนจุดขายและสีที่ใช้บนแผนที่ซ่าทั่วไทย
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Box
            key={row.colorKey}
            sx={{
              p: 2,
              gap: 2,
              display: 'grid',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2.5,
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 1fr) 150px 150px' },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: row.color,
                  border: '1px solid rgba(53,17,41,.18)',
                }}
              />
              <Typography sx={{ fontWeight: 800 }}>{row.label}</Typography>
            </Stack>

            <TextField
              type="number"
              label={row.countLabel}
              value={row.count}
              disabled={!row.countKey}
              onChange={(event) => {
                if (!row.countKey) return;
                onChange({
                  ...settings,
                  [row.countKey]: Number(event.target.value),
                });
              }}
              slotProps={{ htmlInput: { min: 1, max: 999999, step: 1 } }}
            />

            <TextField
              type="color"
              label="สี"
              value={settings[row.colorKey]}
              onChange={(event) =>
                onChange({
                  ...settings,
                  [row.colorKey]: event.target.value.toUpperCase(),
                })
              }
              helperText={settings[row.colorKey]}
            />
          </Box>
        ))}
      </Stack>

      {!isValidProvinceColorSettings(settings) ? (
        <Alert severity="error">
          ตัวเลขสูงสุดของแต่ละช่วงต้องเป็นจำนวนเต็มและเรียงจากน้อยไปมาก
        </Alert>
      ) : null}
    </Stack>
  );
}

export function AdminSettingsPanel({
  initialDuplicateRadiusM,
  initialSearchRadiusM,
  initialProvinceColorSettings,
  updatedAt,
  hasError = false,
}: AdminSettingsPanelProps) {
  const [duplicateRadiusM, setDuplicateRadiusM] = useState(initialDuplicateRadiusM);
  const [searchRadiusM, setSearchRadiusM] = useState(initialSearchRadiusM);
  const [provinceColorSettings, setProvinceColorSettings] = useState(
    initialProvinceColorSettings
  );
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
        body: JSON.stringify({ duplicateRadiusM, searchRadiusM, provinceColorSettings }),
      });
      const payload = (await response.json()) as {
        error?: string;
        settings?: {
          duplicateRadiusM: number;
          searchRadiusM: number;
          provinceColorSettings: ProvinceColorSettings;
          updatedAt: string;
        };
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }

      setDuplicateRadiusM(payload.settings.duplicateRadiusM);
      setSearchRadiusM(payload.settings.searchRadiusM);
      setProvinceColorSettings(payload.settings.provinceColorSettings);
      setLastUpdatedAt(payload.settings.updatedAt);
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว' });
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
          กำหนดกติกาการรับพิกัดและรูปแบบการแสดงผลบนแผนที่
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

          <Divider />

          <ProvinceColorField
            settings={provinceColorSettings}
            onChange={(settings) => {
              setProvinceColorSettings(settings);
              setMessage(null);
            }}
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
              disabled={saving || hasError || !isValidProvinceColorSettings(provinceColorSettings)}
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
