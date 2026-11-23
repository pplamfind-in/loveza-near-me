'use client';

import type { ReactNode } from 'react';
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
  children: ReactNode;
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
  border: '5px solid var(--palette-background-paper)',
  borderRadius: '16px',
  bgcolor: 'background.paper',
  boxShadow: 'var(--card-shadow, var(--customShadows-card))',
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
            color: 'primary.main',
            display: 'grid',
            flexShrink: 0,
            borderRadius: '16px',
            placeItems: 'center',
            bgcolor: 'primary.lighter',
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

      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 1 }}>
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
  const fields = [
    { color: 'noDataColor', max: null },
    { color: 'tier1Color', max: 'tier1Max' },
    { color: 'tier2Color', max: 'tier2Max' },
    { color: 'tier3Color', max: 'tier3Max' },
    { color: 'tier4Color', max: null },
  ] as const;
  const rowSx = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr) 64px 40px',
      sm: 'minmax(0, 1.5fr) minmax(84px, 0.7fr) minmax(120px, 1fr)',
    },
    alignItems: 'center',
    gap: { xs: 1, sm: 2 },
    px: { xs: 1, sm: 1.5 },
    py: 0.875,
    '& > :nth-child(2)': { justifySelf: 'center', textAlign: 'center' },
  };

  return (
    <Stack spacing={1.5} sx={{ ...SETTINGS_SECTION_SX, width: 1, maxWidth: 760 }} data-full-width>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Iconify icon="ri:palette-fill" width={22} sx={{ color: 'primary.main' }} />
        <Typography component="h3" variant="h6">
          สีสถานะจังหวัด
        </Typography>
      </Stack>

      <Box
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}
      >
        <Box
          sx={{
            ...rowSx,
            typography: 'caption',
            fontWeight: 800,
            color: 'primary.dark',
            bgcolor: 'primary.lighter',
          }}
        >
          <span>ช่วงจำนวนจุดขาย</span>
          <span>สูงสุด</span>
          <span>สี</span>
        </Box>
        {scale.map(({ label }, index) => {
          const { color, max } = fields[index];
          return (
            <Box
              key={color}
              sx={{
                ...rowSx,
                borderTop: '1px solid',
                borderColor: 'divider',
                '&:focus-within': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {label}
              </Typography>
              {max ? (
                <TextField
                  type="number"
                  size="small"
                  value={settings[max]}
                  sx={{
                    width: { xs: 60, sm: 80 },
                    '& input': {
                      px: 0.5,
                      py: 0.75,
                      textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    },
                  }}
                  onChange={(event) => onChange({ ...settings, [max]: Number(event.target.value) })}
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 999999,
                      step: 1,
                      'aria-label': `จำนวนสูงสุดสำหรับ ${label}`,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="input"
                  type="color"
                  aria-label={`สีสำหรับ ${label}`}
                  value={settings[color]}
                  onChange={(event) =>
                    onChange({ ...settings, [color]: event.target.value.toUpperCase() })
                  }
                  sx={{
                    width: 36,
                    height: 34,
                    p: '4px',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&::-webkit-color-swatch-wrapper': { p: 0 },
                    '&::-webkit-color-swatch': { border: 0, borderRadius: '4px' },
                    '&::-moz-color-swatch': { border: 0, borderRadius: '4px' },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' }, fontFamily: 'monospace' }}
                >
                  {settings[color]}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {!isValidProvinceColorSettings(settings) ? (
        <Alert severity="error">
          ตัวเลขสูงสุดของแต่ละช่วงต้องเป็นจำนวนเต็มและเรียงจากน้อยไปมาก
        </Alert>
      ) : null}
    </Stack>
  );
}

export function AdminSettingsPanel({
  children,
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
          color: 'text.primary',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '16px',
          bgcolor: 'primary.lighter',
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
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              color: 'primary.dark',
              display: 'grid',
              flexShrink: 0,
              borderRadius: '16px',
              placeItems: 'center',
              bgcolor: 'secondary.lighter',
              boxShadow: 'none',
            }}
          >
            <Iconify icon="ri:settings-4-fill" width={28} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>
              ตั้งค่าระบบ
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
              จัดการบัญชีส่งอีเมล การเผยแพร่ข้อมูล และการตั้งค่าแผนที่
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack
        component="nav"
        aria-label="หมวดการตั้งค่า"
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Button
          href="#gmail-smtp"
          variant="outlined"
          startIcon={<Iconify icon="ri:mail-settings-line" />}
        >
          Gmail SMTP
        </Button>
        <Button
          href="#website-settings"
          variant="outlined"
          startIcon={<Iconify icon="ri:global-line" />}
        >
          เว็บไซต์และการเผยแพร่
        </Button>
        <Button
          href="#map-settings"
          variant="outlined"
          startIcon={<Iconify icon="ri:map-2-line" />}
        >
          แผนที่และพิกัด
        </Button>
      </Stack>

      {children}

      {hasError ? (
        <Alert severity="error">
          โหลดการตั้งค่าไม่สำเร็จ กรุณาตรวจสอบว่าได้รัน migration ล่าสุดแล้ว
        </Alert>
      ) : null}

      <Box>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
            '& > h2, & > [data-full-width], & > .MuiAlert-root, & > :last-child': {
              gridColumn: '1 / -1',
            },
            '& > h2': { scrollMarginTop: 'calc(var(--layout-header-desktop-height, 80px) + 24px)' },
          }}
        >
          <Typography id="website-settings" component="h2" variant="h5">
            เว็บไซต์และการเผยแพร่
          </Typography>
          <Stack spacing={2} sx={{ ...SETTINGS_SECTION_SX, alignSelf: 'stretch' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  color: 'primary.main',
                  display: 'grid',
                  flexShrink: 0,
                  borderRadius: '16px',
                  placeItems: 'center',
                  bgcolor: 'primary.lighter',
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
                borderRadius: '16px',
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

          <Stack spacing={2} sx={{ ...SETTINGS_SECTION_SX, alignSelf: 'stretch' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  color: 'primary.main',
                  display: 'grid',
                  flexShrink: 0,
                  borderRadius: '16px',
                  placeItems: 'center',
                  bgcolor: 'primary.lighter',
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
                borderRadius: '16px',
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

          <Stack spacing={2} sx={SETTINGS_SECTION_SX} data-full-width>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  color: 'primary.main',
                  display: 'grid',
                  flexShrink: 0,
                  borderRadius: '16px',
                  placeItems: 'center',
                  bgcolor: 'primary.lighter',
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
                    fontWeight: option.value === 'kanit' ? 600 : 700,
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

          <Typography id="map-settings" component="h2" variant="h5">
            แผนที่และพิกัด
          </Typography>

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
              borderRadius: '16px',
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
              sx={{ minWidth: 150, borderRadius: '12px' }}
            >
              {saving ? 'กำลังบันทึก' : 'บันทึกการตั้งค่า'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}
