'use client';

import type { StoreStatus } from 'src/types/store';
import type { UserReport } from 'src/app/account/use-account-reports';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { MAX_PHOTO_SIZE } from 'src/app/report/schema';
import {
  useAccountReportsQuery,
  useUpdateStoreStockMutation,
} from 'src/app/account/use-account-reports';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { FLAVOR_OPTIONS } from 'src/types/report';
import { STORE_STATUS_LABEL } from 'src/types/store';

const statusLabels: Record<string, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'รอตรวจสอบ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'success' },
  rejected: { label: 'ไม่อนุมัติ', color: 'error' },
};

const flavorLabel = (value: string) =>
  FLAVOR_OPTIONS.find((option) => option.value === value)?.label ?? value;

const STOCK_STATUS_OPTIONS = (['available', 'low_stock', 'out_of_stock', 'unknown'] as const).map(
  (value) => ({ value, label: STORE_STATUS_LABEL[value] })
);

type StockUpdateDialogProps = {
  report: UserReport;
  onClose: () => void;
};

function StockUpdateDialog({ report, onClose }: StockUpdateDialogProps) {
  const mutation = useUpdateStoreStockMutation();
  const {
    coordinates,
    isLoading: locating,
    error: locationError,
    requestLocation,
  } = useGeolocation();
  const [stockStatus, setStockStatus] = useState<StoreStatus>(report.stock_status as StoreStatus);
  const [estimatedQuantity, setEstimatedQuantity] = useState(
    report.estimated_quantity?.toString() ?? ''
  );
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const numericQuantity = estimatedQuantity === '' ? null : Number(estimatedQuantity);
  const quantityIsValid =
    numericQuantity === null ||
    (Number.isInteger(numericQuantity) && numericQuantity >= 0 && numericQuantity <= 9999);

  const handleStatusChange = (nextStatus: StoreStatus) => {
    setStockStatus(nextStatus);
    if (nextStatus === 'out_of_stock') setEstimatedQuantity('0');
    if (nextStatus === 'unknown') setEstimatedQuantity('');
  };

  const handleSubmit = () => {
    if (!coordinates || !quantityIsValid) return;

    mutation.mutate(
      {
        reportId: report.id,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        stockStatus,
        estimatedQuantity: stockStatus === 'out_of_stock' ? 0 : numericQuantity,
        note,
        photo,
      },
      {
        onSuccess: (payload) => {
          toast.success(payload.message || 'ส่งข้อมูลอัปเดตแล้ว');
          onClose();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <Dialog
      open
      aria-labelledby="stock-update-dialog-title"
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: '18px' } } }}
    >
      <DialogTitle id="stock-update-dialog-title" sx={{ pb: 1, fontSize: 24, fontWeight: 900 }}>
        อัปเดตสถานะสินค้า
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2.5, color: 'text.secondary' }}>
          {report.store_name} · ระบบจะสร้างรายงานใหม่และเก็บประวัติเดิมไว้
        </Typography>

        <Stack spacing={2.25}>
          <TextField
            select
            fullWidth
            label="สถานะสินค้า"
            value={stockStatus}
            onChange={(event) => handleStatusChange(event.target.value as StoreStatus)}
          >
            {STOCK_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            type="number"
            label="จำนวนโดยประมาณ (กระป๋อง)"
            value={estimatedQuantity}
            disabled={stockStatus === 'out_of_stock'}
            error={!quantityIsValid}
            helperText={
              !quantityIsValid ? 'จำนวนต้องเป็นเลขจำนวนเต็ม 0–9,999' : 'เว้นว่างได้ถ้าไม่แน่ใจ'
            }
            onChange={(event) => setEstimatedQuantity(event.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 9999, step: 1 } }}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="หมายเหตุ (ไม่บังคับ)"
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 500))}
            helperText={`${note.length}/500`}
          />

          <Box>
            <Typography sx={{ mb: 0.75, fontWeight: 800 }}>เพิ่มหลักฐานความซ่า</Typography>
            <Typography sx={{ mb: 1.5, color: 'text.secondary', fontSize: 14 }}>
              แชะรูปชั้นวางหรือหน้าร้านไว้ยืนยันสถานะ จะได้ชัวร์แบบไม่ต้องเดา
            </Typography>
            <Upload
              value={photo}
              accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
              maxSize={MAX_PHOTO_SIZE}
              onDrop={(acceptedFiles) => setPhoto(acceptedFiles[0] ?? null)}
              onDelete={() => setPhoto(null)}
              helperText="รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB · ไม่ใส่ก็ได้"
            />
          </Box>

          <Button
            variant={coordinates ? 'outlined' : 'contained'}
            disabled={locating || mutation.isPending}
            onClick={requestLocation}
            startIcon={
              locating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="ri:map-pin-user-fill" />
              )
            }
            sx={{ alignSelf: 'flex-start', borderRadius: '12px' }}
          >
            {locating
              ? 'กำลังตรวจตำแหน่ง'
              : coordinates
                ? 'ตรวจตำแหน่งอีกครั้ง'
                : 'ตรวจตำแหน่งปัจจุบัน'}
          </Button>

          {coordinates ? (
            <Alert severity="success">ตรวจตำแหน่งแล้ว พร้อมส่งข้อมูลอัปเดต</Alert>
          ) : null}
          {locationError ? <Alert severity="error">{locationError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1.5 }}>
        <Button color="inherit" disabled={mutation.isPending} onClick={onClose}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={!coordinates || !quantityIsValid || mutation.isPending}
          onClick={handleSubmit}
          startIcon={
            mutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {mutation.isPending ? 'กำลังส่งข้อมูล' : 'ยืนยันการอัปเดต'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReportHistorySection() {
  const [stockUpdateReport, setStockUpdateReport] = useState<UserReport | null>(null);
  const { data: reports = [], isLoading: loading, isError } = useAccountReportsQuery();
  const error = isError ? 'โหลดประวัติการแจ้งพิกัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : '';

  const pendingCount = reports.filter((report) => report.approval_status === 'pending').length;
  const approvedCount = reports.filter((report) => report.approval_status === 'approved').length;

  return (
    <Box
      id="report-history"
      sx={{
        p: { xs: 2, md: 3 },
        minWidth: 0,
        border: '5px solid var(--palette-background-paper)',
        borderRadius: '18px',
        bgcolor: 'var(--palette-background-paper)',
        boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
        scrollMarginTop: 100,
        '& .MuiChip-root': { borderRadius: '8px' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography component="h2" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 900 }}>
            ประวัติการแจ้งพิกัด
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            ติดตามสถานะข้อมูลที่คุณช่วยแจ้งให้ชุมชน Loveza
          </Typography>
        </Box>
        <Button
          href="/report"
          variant="contained"
          sx={{
            color: 'primary.contrastText',
            border: '1px solid var(--palette-grey-300)',
            borderRadius: '12px',
            backgroundImage: 'none',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
          }}
        >
          + แจ้งพิกัดใหม่
        </Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {[
              {
                label: 'ทั้งหมด',
                value: reports.length,
                color: 'var(--palette-primary-main)',
                bgcolor: 'var(--palette-primary-lighter)',
              },
              {
                label: 'รอตรวจสอบ',
                value: pendingCount,
                color: '#b87500',
                bgcolor: 'var(--palette-secondary-lighter)',
              },
              {
                label: 'อนุมัติแล้ว',
                value: approvedCount,
                color: 'var(--palette-primary-dark)',
                bgcolor: 'var(--palette-primary-lighter)',
              },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  flexWrap: 'wrap',
                  border: '5px solid var(--palette-background-paper)',
                  borderRadius: '14px',
                  bgcolor: item.bgcolor,
                  boxShadow: 'none',
                }}
              >
                <Typography
                  sx={{ color: item.color, fontSize: { xs: 24, sm: 30 }, fontWeight: 900 }}
                >
                  {item.value}
                </Typography>
                <Typography sx={{ color: item.color, fontSize: 12, fontWeight: 800 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
            {reports.map((report) => {
              const status = statusLabels[report.approval_status] ?? statusLabels.pending;

              return (
                <Paper
                  key={report.id}
                  elevation={0}
                  sx={{
                    p: { xs: 1.75, sm: 2 },
                    overflow: 'hidden',
                    background:
                      'linear-gradient(90deg, #FBF6ED 25%, rgba(251,246,237,.96) 65%, rgba(251,246,237,.8) 100%), url(/assets/loveza/nearby-explorer-v1.webp) right center / cover',
                    border: '5px solid var(--palette-background-paper)',
                    borderRadius: '18px',
                    boxShadow: '0 4px 0 var(--palette-grey-200)',
                    bgcolor: 'var(--palette-background-default)',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                  >
                    <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
                      <Box
                        component="img"
                        src={report.store_type_logo_url || '/assets/icons/loveza/voxel-store.svg'}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/assets/icons/loveza/voxel-store.svg';
                        }}
                        sx={{
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                          objectFit: 'contain',
                          p: 0.5,
                          borderRadius: '12px',
                          bgcolor: 'background.paper',
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, lineHeight: 1.5 }}
                        >
                          {report.store_name}
                        </Typography>
                        <Chip
                          size="small"
                          label={report.store_type_name || report.store_type}
                          sx={{
                            mt: 0.75,
                            color: 'var(--palette-primary-main)',
                            fontWeight: 900,
                            bgcolor: 'var(--palette-primary-lighter)',
                          }}
                        />
                        <Typography
                          sx={{ mt: 0.5, color: 'text.secondary', fontSize: 13, lineHeight: 1.6 }}
                        >
                          {[report.address, report.district, report.province]
                            .filter(Boolean)
                            .join(', ')}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label={status.label} color={status.color} size="small" />
                  </Stack>
                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip
                      size="small"
                      label={
                        STORE_STATUS_LABEL[
                          report.stock_status as keyof typeof STORE_STATUS_LABEL
                        ] ?? report.stock_status
                      }
                      sx={{
                        borderRadius: '8px',
                        bgcolor: 'secondary.lighter',
                        color: 'secondary.dark',
                      }}
                    />
                    {report.estimated_quantity !== null && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`ประมาณ ${report.estimated_quantity} กระป๋อง`}
                        sx={{ borderRadius: '8px' }}
                      />
                    )}
                  </Stack>
                  {Boolean(report.flavors?.length) && (
                    <Typography
                      sx={{ mt: 1, fontSize: 14, color: 'text.secondary', lineHeight: 1.7 }}
                    >
                      {report.flavors?.map(flavorLabel).join(' · ')}
                    </Typography>
                  )}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                      แจ้งเมื่อ {new Date(report.created_at).toLocaleString('th-TH')}
                    </Typography>
                    {report.approval_status === 'approved' && report.store_id ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setStockUpdateReport(report)}
                        startIcon={<Iconify icon="ri:refresh-line" />}
                        sx={{
                          minHeight: 36,
                          flexShrink: 0,
                          px: 2,
                          borderRadius: '12px',
                          borderColor: 'primary.light',
                          bgcolor: 'background.paper',
                          boxShadow: 'none',
                        }}
                      >
                        อัปเดตสถานะสินค้า
                      </Button>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}

            {reports.length === 0 ? (
              <Paper elevation={0} sx={{ p: 5, borderRadius: '12px', textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800 }}>ยังไม่มีประวัติการแจ้งพิกัด</Typography>
                <Typography sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
                  ถ้าพบ Loveza ที่ร้านไหน ช่วยบอกต่อเป็นคนแรกได้เลย
                </Typography>
              </Paper>
            ) : null}
          </Stack>
        </>
      )}

      {stockUpdateReport ? (
        <StockUpdateDialog
          key={stockUpdateReport.id}
          report={stockUpdateReport}
          onClose={() => setStockUpdateReport(null)}
        />
      ) : null}
    </Box>
  );
}
