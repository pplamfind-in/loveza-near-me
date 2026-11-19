'use client';

import type { LandingBanner } from 'src/types/landing-banner';
import type { LandingBannerInput } from 'src/app/admin/banners/schema';

import Image from 'next/image';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { MAX_LANDING_BANNER_IMAGE_SIZE } from 'src/lib/supabase/landing-banner-image';
import {
  useAdminBannersQuery,
  useSaveBannerMutation,
  useDeleteBannerMutation,
} from 'src/app/admin/banners/use-admin-banners';

import { Upload } from 'src/components/upload';
import { Iconify } from 'src/components/iconify';

type BannerFormValue = Omit<LandingBannerInput, 'image_url' | 'mobile_image_url'> & {
  image_url: string;
  mobile_image_url: string;
};

const EMPTY_BANNER: BannerFormValue = {
  title: '',
  image_url: '',
  mobile_image_url: '',
  alt_text: '',
  sort_order: 0,
  is_active: true,
};

const IMAGE_ACCEPT = {
  'image/jpeg': [],
  'image/png': [],
  'image/webp': [],
};

const toFormValue = (banner: LandingBanner): BannerFormValue => ({
  title: banner.title,
  image_url: banner.image_url,
  mobile_image_url: banner.mobile_image_url ?? '',
  alt_text: banner.alt_text,
  sort_order: banner.sort_order,
  is_active: banner.is_active,
});

export function BannersPanel() {
  const { data: banners = [], isLoading, isError } = useAdminBannersQuery();
  const saveMutation = useSaveBannerMutation();
  const deleteMutation = useDeleteBannerMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<LandingBanner | null>(null);
  const [form, setForm] = useState<BannerFormValue>(EMPTY_BANNER);
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const setField = <Key extends keyof BannerFormValue>(key: Key, value: BannerFormValue[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditingBanner(null);
    setForm({ ...EMPTY_BANNER, sort_order: banners.length + 1 });
    setDesktopImage(null);
    setMobileImage(null);
    setFormError('');
    saveMutation.reset();
    setDialogOpen(true);
  };

  const openEdit = (banner: LandingBanner) => {
    setEditingBanner(banner);
    setForm(toFormValue(banner));
    setDesktopImage(null);
    setMobileImage(null);
    setFormError('');
    saveMutation.reset();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saveMutation.isPending) setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setFormError('กรุณาระบุชื่อ Banner');
      return;
    }
    if (!desktopImage && !form.image_url) {
      setFormError('กรุณาเพิ่มรูป Banner สำหรับ Desktop');
      return;
    }

    setFormError('');
    saveMutation.mutate(
      {
        id: editingBanner?.id,
        desktopImage,
        mobileImage,
        values: {
          ...form,
          mobile_image_url: form.mobile_image_url || null,
        },
      },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleDelete = (banner: LandingBanner) => {
    if (!window.confirm(`ยืนยันการลบ Banner “${banner.title}”?`)) return;
    deleteMutation.mutate(banner.id);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            จัดการแบนเนอร์
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            แบนเนอร์ ที่เปิดใช้งานจะแสดงและสลับอัตโนมัติบน Hero หน้า Landing ตามลำดับ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="ri:image-add-line" />}
          onClick={openCreate}
          sx={{ alignSelf: 'flex-start', borderRadius: '12px' }}
        >
          เพิ่มแบนเนอร์
        </Button>
      </Stack>

      {isError || deleteMutation.isError ? (
        <Alert severity="error">
          {deleteMutation.error?.message ?? 'โหลดข้อมูล Banner ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table aria-label="รายการแบนเนอร์" size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>แบนเนอร์</TableCell>
                <TableCell>ภาพมือถือ</TableCell>
                <TableCell align="center">ลำดับ</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="right">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id} hover>
                  <TableCell component="th" scope="row">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          position: 'relative',
                          width: 112,
                          height: 48,
                          flexShrink: 0,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          bgcolor: 'background.neutral',
                        }}
                      >
                        <Image
                          fill
                          src={banner.image_url}
                          alt=""
                          sizes="112px"
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0, maxWidth: 280, overflowWrap: 'anywhere' }}>
                        <Typography variant="subtitle2">{banner.title}</Typography>
                        {banner.alt_text && (
                          <Typography variant="caption" color="text.secondary">
                            {banner.alt_text}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {banner.mobile_image_url ? (
                      <Box
                        sx={{
                          position: 'relative',
                          width: 64,
                          height: 48,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          bgcolor: 'background.neutral',
                        }}
                      >
                        <Image
                          fill
                          src={banner.mobile_image_url}
                          alt=""
                          sizes="64px"
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        ใช้ภาพเดียวทุกจอ
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{banner.sort_order}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={banner.is_active ? 'success' : 'default'}
                      label={banner.is_active ? 'แสดงบนเว็บ' : 'ซ่อน'}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      aria-label={`แก้ไข ${banner.title}`}
                      onClick={() => openEdit(banner)}
                    >
                      <Iconify icon="ri:edit-2-line" />
                    </IconButton>
                    <IconButton
                      color="error"
                      aria-label={`ลบ ${banner.title}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(banner)}
                    >
                      <Iconify icon="ri:delete-bin-6-line" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!banners.length && !isError && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    ยังไม่มีแบนเนอร์ กด “เพิ่มแบนเนอร์” เพื่อเริ่มต้น
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingBanner ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {saveMutation.isError ? (
              <Alert severity="error">{saveMutation.error.message}</Alert>
            ) : null}

            <TextField
              required
              label="ชื่อ Banner (ใช้ในหน้า Admin)"
              value={form.title}
              onChange={(event) => setField('title', event.target.value.slice(0, 100))}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              <Box>
                <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 800 }}>
                  ภาพ Desktop{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    *
                  </Box>
                </Typography>
                <Upload
                  value={desktopImage || form.image_url || null}
                  accept={IMAGE_ACCEPT}
                  maxSize={MAX_LANDING_BANNER_IMAGE_SIZE}
                  onDrop={(files) => setDesktopImage(files[0] ?? null)}
                  onDelete={() => {
                    setDesktopImage(null);
                    setField('image_url', '');
                  }}
                  helperText="แนะนำ 1920×900px · JPG, PNG, WEBP ไม่เกิน 10MB"
                  sx={{ minHeight: 230 }}
                />
              </Box>

              <Box>
                <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 800 }}>
                  ภาพ Mobile (ไม่บังคับ)
                </Typography>
                <Upload
                  value={mobileImage || form.mobile_image_url || null}
                  accept={IMAGE_ACCEPT}
                  maxSize={MAX_LANDING_BANNER_IMAGE_SIZE}
                  onDrop={(files) => setMobileImage(files[0] ?? null)}
                  onDelete={() => {
                    setMobileImage(null);
                    setField('mobile_image_url', '');
                  }}
                  helperText="แนะนำ 900×1200px · หากไม่ใส่จะใช้ภาพ Desktop"
                  sx={{ minHeight: 230 }}
                />
              </Box>
            </Box>

            <TextField
              label="คำอธิบายรูป (Alt text)"
              value={form.alt_text}
              helperText={`${form.alt_text.length}/180 · ช่วยเรื่อง SEO และผู้ใช้โปรแกรมอ่านหน้าจอ`}
              onChange={(event) => setField('alt_text', event.target.value.slice(0, 180))}
            />

            <TextField
              type="number"
              label="ลำดับการแสดง"
              value={form.sort_order}
              slotProps={{ htmlInput: { min: 0, max: 9999 } }}
              onChange={(event) => setField('sort_order', Number(event.target.value))}
            />

            <FormControlLabel
              label="แสดง Banner นี้บน Landing"
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(event) => setField('is_active', event.target.checked)}
                />
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button color="inherit" disabled={saveMutation.isPending} onClick={closeDialog}>
            ยกเลิก
          </Button>
          <Button variant="contained" disabled={saveMutation.isPending} onClick={handleSubmit}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
