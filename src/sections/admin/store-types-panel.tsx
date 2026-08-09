'use client';

import type { StoreTypeMaster } from 'src/types/store-type';
import type { StoreTypeMasterInput } from 'src/app/admin/store-types/schema';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import {
  STORE_TYPE_LOGO_TYPES,
  MAX_STORE_TYPE_LOGO_SIZE,
} from 'src/lib/supabase/store-type-logo';
import {
  useAdminStoreTypesQuery,
  useSaveStoreTypeMutation,
  useDeleteStoreTypeMutation,
} from 'src/app/admin/store-types/use-admin-store-types';

import { Iconify } from 'src/components/iconify';

type FormValue = StoreTypeMasterInput & { logo_url: string };

const EMPTY_VALUE: FormValue = {
  code: '',
  name: '',
  logo_url: '',
  sort_order: 0,
  is_active: true,
};

const toCode = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export function StoreTypesPanel() {
  const { data: storeTypes = [], isLoading, isError } = useAdminStoreTypesQuery();
  const saveMutation = useSaveStoreTypeMutation();
  const deleteMutation = useDeleteStoreTypeMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreTypeMaster | null>(null);
  const [form, setForm] = useState<FormValue>(EMPTY_VALUE);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!logoPreview.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_VALUE, sort_order: storeTypes.length * 10 + 10 });
    setLogoFile(null);
    setLogoPreview('');
    setLogoError(null);
    saveMutation.reset();
    setDialogOpen(true);
  };

  const openEdit = (item: StoreTypeMaster) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      logo_url: item.logo_url ?? '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setLogoFile(null);
    setLogoPreview(item.logo_url ?? '');
    setLogoError(null);
    saveMutation.reset();
    setDialogOpen(true);
  };

  const handleLogo = (file: File | null) => {
    setLogoError(null);
    if (!file) return;
    if (!STORE_TYPE_LOGO_TYPES.includes(file.type)) {
      setLogoError('รองรับเฉพาะ JPG, PNG หรือ WEBP');
      return;
    }
    if (file.size > MAX_STORE_TYPE_LOGO_SIZE) {
      setLogoError('Logo ต้องมีขนาดไม่เกิน 2MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    saveMutation.mutate(
      { id: editing?.id, logo: logoFile, values: form },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleDelete = (item: StoreTypeMaster) => {
    if (!window.confirm(`ยืนยันการลบประเภท “${item.name}”?`)) return;
    deleteMutation.mutate(item.id);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            Master ประเภทร้านค้า
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการตัวเลือกในหน้าแจ้งพิกัด และ Logo ที่แสดงในหมุดร้านบนแผนที่
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Iconify icon="ri:add-line" />} onClick={openCreate}>
          เพิ่มประเภทร้าน
        </Button>
      </Stack>

      {isError || deleteMutation.isError ? (
        <Alert severity="error">
          {deleteMutation.error?.message ?? 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          {storeTypes.map((item) => (
            <Paper key={item.id} elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    p: 1,
                    display: 'grid',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '50%',
                    placeItems: 'center',
                    bgcolor: '#FFF0F8',
                    border: '2px solid #351129',
                  }}
                >
                  {item.logo_url ? (
                    <Box component="img" src={item.logo_url} alt={item.name} sx={{ width: 1, height: 1, objectFit: 'contain' }} />
                  ) : (
                    <Iconify icon="ri:store-2-fill" width={28} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography noWrap sx={{ fontSize: 18, fontWeight: 900 }}>{item.name}</Typography>
                    <Chip size="small" label={item.is_active ? 'ใช้งาน' : 'ซ่อน'} color={item.is_active ? 'success' : 'default'} />
                  </Stack>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{item.code} · ลำดับ {item.sort_order}</Typography>
                </Box>
                <IconButton aria-label={`แก้ไข ${item.name}`} onClick={() => openEdit(item)}><Iconify icon="ri:edit-2-line" /></IconButton>
                <IconButton color="error" aria-label={`ลบ ${item.name}`} onClick={() => handleDelete(item)}><Iconify icon="ri:delete-bin-6-line" /></IconButton>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !saveMutation.isPending && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'แก้ไขประเภทร้าน' : 'เพิ่มประเภทร้าน'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {saveMutation.isError ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}
          <TextField required label="ชื่อประเภทร้าน" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, code: editing ? current.code : toCode(event.target.value) }))} />
          <TextField required label="Code" helperText="เช่น seven_eleven หรือ cj_more" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: toCode(event.target.value) }))} />
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Logo ร้านค้า</Typography>
            <Box sx={{ width: 120, height: 120, p: 1.5, display: 'grid', overflow: 'hidden', borderRadius: '50%', placeItems: 'center', bgcolor: '#FFF0F8', border: '2px dashed #351129' }}>
              {logoPreview ? <Box component="img" src={logoPreview} alt="ตัวอย่าง Logo" sx={{ width: 1, height: 1, objectFit: 'contain' }} /> : <Iconify icon="ri:image-add-line" width={34} />}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button component="label" variant="outlined" startIcon={<Iconify icon="ri:upload-2-line" />}>
                {logoPreview ? 'เปลี่ยน Logo' : 'เพิ่ม Logo'}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { handleLogo(event.target.files?.[0] ?? null); event.target.value = ''; }} />
              </Button>
              {logoPreview ? <Button color="error" onClick={() => { setLogoFile(null); setLogoPreview(''); setForm((current) => ({ ...current, logo_url: '' })); }}>ลบ Logo</Button> : null}
            </Stack>
            {logoError ? <Alert severity="error">{logoError}</Alert> : null}
          </Stack>
          <TextField type="number" label="ลำดับการแสดง" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
          <FormControlLabel label="เปิดให้ผู้ใช้เลือกประเภทนี้" control={<Switch checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />} />
        </Stack></DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button color="inherit" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>{saveMutation.isPending ? <CircularProgress size={20} /> : 'บันทึก'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
