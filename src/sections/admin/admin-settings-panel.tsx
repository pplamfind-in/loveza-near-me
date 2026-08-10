'use client';

import type { SiteFont } from 'src/lib/site-font';
import type { ProvinceColorSettings } from 'src/lib/mapza/province-color-scale';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { getBrandOwnerNotice } from 'src/lib/brand-owner-notice';
import { SITE_FONT_OPTIONS, SITE_FONT_PREVIEW_FAMILY } from 'src/lib/site-font';
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
  initialRequireReportApproval: boolean;
  initialBrandOwnerAcknowledged: boolean;
  initialSiteFont: SiteFont;
  initialDuplicateRadiusM: number;
  initialSearchRadiusM: number;
  initialProvinceColorSettings: ProvinceColorSettings;
  updatedAt: string | null;
  hasError?: boolean;
};

const SETTINGS_SECTION_SX = {
  p: { xs: 2.25, md: 3 },
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'background.paper',
  boxShadow: '0 10px 30px rgba(53,17,41,.06)',
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
    <Stack spacing={3} sx={SETTINGS_SECTION_SX}>
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
    <Stack spacing={2.5} sx={SETTINGS_SECTION_SX}>
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
  initialRequireReportApproval,
  initialBrandOwnerAcknowledged,
  initialSiteFont,
  initialDuplicateRadiusM,
  initialSearchRadiusM,
  initialProvinceColorSettings,
  updatedAt,
  hasError = false,
}: AdminSettingsPanelProps) {
  const router = useRouter();
  const [requireReportApproval, setRequireReportApproval] = useState(initialRequireReportApproval);
  const [brandOwnerAcknowledged, setBrandOwnerAcknowledged] = useState(
    initialBrandOwnerAcknowledged
  );
  const [siteFont, setSiteFont] = useState<SiteFont>(initialSiteFont);
  const [duplicateRadiusM, setDuplicateRadiusM] = useState(initialDuplicateRadiusM);
  const [searchRadiusM, setSearchRadiusM] = useState(initialSearchRadiusM);
  const [provinceColorSettings, setProvinceColorSettings] = useState(initialProvinceColorSettings);
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
      const response = await fetch('/api/admin/settings/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requireReportApproval,
          brandOwnerAcknowledged,
          siteFont,
          duplicateRadiusM,
          searchRadiusM,
          provinceColorSettings,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        settings?: {
          requireReportApproval: boolean;
          brandOwnerAcknowledged: boolean;
          siteFont: SiteFont;
          duplicateRadiusM: number;
          searchRadiusM: number;
          provinceColorSettings: ProvinceColorSettings;
          updatedAt: string;
        };
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }

      setRequireReportApproval(payload.settings.requireReportApproval);
      setBrandOwnerAcknowledged(payload.settings.brandOwnerAcknowledged);
      setSiteFont(payload.settings.siteFont);
      setDuplicateRadiusM(payload.settings.duplicateRadiusM);
      setSearchRadiusM(payload.settings.searchRadiusM);
      setProvinceColorSettings(payload.settings.provinceColorSettings);
      setLastUpdatedAt(payload.settings.updatedAt);
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว' });

      if (payload.settings.siteFont !== initialSiteFont) {
        window.location.reload();
      } else {
        router.refresh();
      }
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
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #4B2440 0%, #72003F 55%, #E5007E 140%)',
          boxShadow: '0 14px 36px rgba(75,36,64,.18)',
          '&::after': {
            content: '""',
            width: 180,
            height: 180,
            top: -95,
            right: -45,
            position: 'absolute',
            borderRadius: '50%',
            bgcolor: 'rgba(253,224,71,.16)',
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              color: '#351129',
              display: 'grid',
              flexShrink: 0,
              borderRadius: 2.5,
              placeItems: 'center',
              bgcolor: '#FDE047',
              boxShadow: '3px 4px 0 rgba(53,17,41,.8)',
            }}
          >
            <Iconify icon="ri:settings-4-fill" width={28} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>
              ตั้งค่าระบบ
            </Typography>
            <Typography sx={{ mt: 0.5, color: '#FFD9ED', lineHeight: 1.6 }}>
              จัดการกติกาการรับข้อมูล ภาพลักษณ์เว็บไซต์ และการแสดงผลบนแผนที่
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {hasError ? (
        <Alert severity="error">
          โหลดการตั้งค่าไม่สำเร็จ กรุณาตรวจสอบว่าได้รัน migration ล่าสุดแล้ว
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
        <Stack spacing={3}>
          <Stack spacing={2} sx={SETTINGS_SECTION_SX}>
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
                <Iconify icon="ri:shield-check-fill" width={28} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900 }}>การอนุมัติพิกัดใหม่</Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
                  เลือกว่าจะตรวจสอบรายงานก่อน หรือเผยแพร่ขึ้นแผนที่ทันที
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: requireReportApproval ? 'warning.main' : 'success.main',
                borderRadius: 2.5,
                bgcolor: requireReportApproval ? 'warning.lighter' : 'success.lighter',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    {requireReportApproval ? 'รอแอดมินอนุมัติก่อนแสดง' : 'อนุมัติและแสดงทันที'}
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                    {requireReportApproval
                      ? 'รายงานใหม่จะอยู่ในรายการรอตรวจสอบจนกว่าแอดมินจะอนุมัติ'
                      : 'รายงานใหม่จะถูกเพิ่มเป็นจุดขายบนแผนที่ทันทีโดยไม่ผ่านการตรวจสอบ'}
                  </Typography>
                </Box>
                <Switch
                  checked={!requireReportApproval}
                  onChange={(event) => {
                    setRequireReportApproval(!event.target.checked);
                    setMessage(null);
                  }}
                  slotProps={{ input: { 'aria-label': 'อนุมัติรายงานอัตโนมัติ' } }}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack spacing={2} sx={SETTINGS_SECTION_SX}>
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
                <Iconify icon="ri:verified-badge-fill" width={28} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900 }}>
                  การรับทราบจากเจ้าของแบรนด์ LOVEZA
                </Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
                  เปิดเมื่อได้รับการยืนยันว่าเจ้าของแบรนด์รับทราบการดำเนินงานของเว็บไซต์แล้ว
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: brandOwnerAcknowledged ? 'success.main' : 'warning.main',
                borderRadius: 2.5,
                bgcolor: brandOwnerAcknowledged ? 'success.lighter' : 'warning.lighter',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>
                    {brandOwnerAcknowledged
                      ? 'เจ้าของแบรนด์รับทราบแล้ว'
                      : 'ยังไม่มีการยืนยันการรับทราบ'}
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                    ข้อความแจ้งผู้ใช้ใน Footer จะเปลี่ยนตามสถานะนี้
                  </Typography>
                </Box>
                <Switch
                  checked={brandOwnerAcknowledged}
                  onChange={(event) => {
                    setBrandOwnerAcknowledged(event.target.checked);
                    setMessage(null);
                  }}
                  slotProps={{ input: { 'aria-label': 'เจ้าของแบรนด์รับทราบแล้ว' } }}
                />
              </Stack>
            </Box>

            <Alert severity={brandOwnerAcknowledged ? 'success' : 'info'}>
              <Typography sx={{ fontWeight: 900 }}>ตัวอย่างข้อความที่ผู้ใช้จะเห็น</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.7 }}>
                {getBrandOwnerNotice(brandOwnerAcknowledged)}
              </Typography>
            </Alert>
          </Stack>

          <Stack spacing={2} sx={SETTINGS_SECTION_SX}>
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
                <Iconify icon="ri:font-size-2" width={28} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900 }}>ฟอนต์ของเว็บไซต์</Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
                  เลือกฟอนต์หลักที่ผู้ใช้จะเห็นทั้งเว็บไซต์
                </Typography>
              </Box>
            </Stack>

            <ToggleButtonGroup
              exclusive
              fullWidth
              value={siteFont}
              onChange={(_event, value: SiteFont | null) => {
                if (!value) return;
                setSiteFont(value);
                setMessage(null);
              }}
              aria-label="ฟอนต์ของเว็บไซต์"
              sx={{ maxWidth: 620 }}
            >
              {SITE_FONT_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  sx={{
                    py: 2,
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontFamily: SITE_FONT_PREVIEW_FAMILY[option.value],
                  }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Alert severity="info">
              ฟอนต์ที่เลือกจะมีผลกับหน้าสาธารณะและหน้า Admin หลังจากกดบันทึก
            </Alert>
          </Stack>

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
            sx={{
              p: 2,
              bottom: 16,
              zIndex: 5,
              position: 'sticky',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,.94)',
              boxShadow: '0 14px 40px rgba(53,17,41,.14)',
              backdropFilter: 'blur(12px)',
            }}
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
