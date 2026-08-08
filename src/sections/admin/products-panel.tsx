'use client';

import type { LovezaProduct } from 'src/types/loveza-product';
import type { ProductInput } from 'src/app/admin/products/schema';

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
  PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
} from 'src/lib/supabase/product-image';
import {
  useAdminProductsQuery,
  useSaveProductMutation,
  useDeleteProductMutation,
} from 'src/app/admin/products/use-admin-products';

import { Iconify } from 'src/components/iconify';

type ProductFormValue = Omit<ProductInput, 'description' | 'image_url'> & {
  description: string;
  image_url: string;
};

const EMPTY_PRODUCT: ProductFormValue = {
  name: '',
  thai_name: '',
  slug: '',
  description: '',
  image_url: '',
  color: '#00a9dc',
  accent: '#087cae',
  fruit: '🥤',
  meta: 'VITAMIN B3 • B6 • B12',
  sort_order: 0,
  is_active: true,
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const toFormValue = (product: LovezaProduct): ProductFormValue => ({
  name: product.name,
  thai_name: product.thai_name,
  slug: product.slug,
  description: product.description ?? '',
  image_url: product.image_url ?? '',
  color: product.color,
  accent: product.accent,
  fruit: product.fruit,
  meta: product.meta,
  sort_order: product.sort_order,
  is_active: product.is_active,
});

export function ProductsPanel() {
  const { data: products = [], isLoading, isError } = useAdminProductsQuery();
  const saveMutation = useSaveProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LovezaProduct | null>(null);
  const [form, setForm] = useState<ProductFormValue>(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePreview.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_PRODUCT, sort_order: products.length + 1 });
    setImageFile(null);
    setImagePreview('');
    setImageError(null);
    saveMutation.reset();
    setDialogOpen(true);
  };

  const openEdit = (product: LovezaProduct) => {
    setEditingProduct(product);
    setForm(toFormValue(product));
    setImageFile(null);
    setImagePreview(product.image_url ?? '');
    setImageError(null);
    saveMutation.reset();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saveMutation.isPending) setDialogOpen(false);
  };

  const setField = <Key extends keyof ProductFormValue>(
    key: Key,
    value: ProductFormValue[Key]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingProduct || current.slug ? current.slug : toSlug(value),
    }));
  };

  const handleSubmit = () => {
    saveMutation.mutate(
      {
        id: editingProduct?.id,
        image: imageFile,
        values: {
          ...form,
          description: form.description || null,
          image_url: form.image_url || null,
        },
      },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleImageChange = (file: File | null) => {
    setImageError(null);
    if (!file) return;

    if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
      setImageError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setImageError('ไฟล์รูปต้องไม่เกิน 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setField('image_url', '');
    setImageError(null);
  };

  const handleDelete = (product: LovezaProduct) => {
    if (!window.confirm(`ยืนยันการลบ ${product.name}?`)) return;
    deleteMutation.mutate(product.id);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            จัดการสินค้า
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            สินค้าที่เปิดใช้งานจะแสดงใน section รสชาติบนหน้า Landing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="ri:add-line" />}
          onClick={openCreate}
          sx={{ flexShrink: 0, borderRadius: 99 }}
        >
          เพิ่มสินค้า
        </Button>
      </Stack>

      {isError || deleteMutation.isError ? (
        <Alert severity="error">
          {deleteMutation.error?.message ?? 'โหลดข้อมูลสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {products.map((product) => (
            <Paper key={product.id} elevation={0} sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 84,
                    height: 100,
                    flexShrink: 0,
                    display: 'grid',
                    overflow: 'hidden',
                    borderRadius: 2,
                    placeItems: 'center',
                    color: '#fff',
                    fontSize: 34,
                    background: `linear-gradient(145deg, ${product.color}, ${product.accent})`,
                  }}
                >
                  {product.image_url ? (
                    <Box
                      component="img"
                      src={product.image_url}
                      alt={product.name}
                      sx={{ width: 1, height: 1, objectFit: 'cover' }}
                    />
                  ) : (
                    product.fruit
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography noWrap sx={{ fontSize: 19, fontWeight: 900 }}>
                      {product.name}
                    </Typography>
                    <Chip
                      size="small"
                      color={product.is_active ? 'success' : 'default'}
                      label={product.is_active ? 'แสดงบนเว็บ' : 'ซ่อน'}
                    />
                  </Stack>
                  <Typography noWrap sx={{ color: 'text.secondary' }}>
                    {product.thai_name}
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: 12 }}>
                    /{product.slug} · ลำดับ {product.sort_order}
                  </Typography>
                </Box>
                <Stack direction="row">
                  <IconButton aria-label={`แก้ไข ${product.name}`} onClick={() => openEdit(product)}>
                    <Iconify icon="ri:edit-2-line" />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label={`ลบ ${product.name}`}
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(product)}
                  >
                    <Iconify icon="ri:delete-bin-6-line" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}

          {products.length === 0 ? (
            <Paper elevation={0} sx={{ gridColumn: '1 / -1', p: 8, textAlign: 'center', borderRadius: 3 }}>
              <Typography color="text.secondary">ยังไม่มีสินค้า กด “เพิ่มสินค้า” เพื่อเริ่มต้น</Typography>
            </Paper>
          ) : null}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {saveMutation.isError ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}
            <TextField
              required
              label="ชื่อสินค้า"
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
            <TextField
              required
              label="ชื่อภาษาไทย"
              value={form.thai_name}
              onChange={(event) => setField('thai_name', event.target.value)}
            />
            <TextField
              required
              label="Slug"
              helperText="ใช้ a-z, 0-9 และขีดกลาง เช่น honey-lemon"
              value={form.slug}
              onChange={(event) => setField('slug', toSlug(event.target.value))}
            />
            <TextField
              multiline
              minRows={2}
              label="คำอธิบาย"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
            />
            <Stack spacing={1.25}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>รูปสินค้า</Typography>
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="ตัวอย่างรูปสินค้า"
                  sx={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 2, bgcolor: '#f4f5f5' }}
                />
              ) : (
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    color: 'text.secondary',
                    display: 'grid',
                    borderRadius: 2,
                    placeItems: 'center',
                    bgcolor: '#f4f5f5',
                  }}
                >
                  <Iconify icon="ri:image-add-line" width={34} />
                </Box>
              )}
              <Stack direction="row" spacing={1}>
                <Button component="label" variant="outlined" startIcon={<Iconify icon="ri:upload-2-line" />}>
                  {imagePreview ? 'เปลี่ยนรูป' : 'เพิ่มรูป'}
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleImageChange(event.target.files?.[0] ?? null);
                      event.target.value = '';
                    }}
                  />
                </Button>
                {imagePreview ? (
                  <Button
                    color="error"
                    variant="text"
                    startIcon={<Iconify icon="ri:delete-bin-6-line" />}
                    onClick={handleRemoveImage}
                  >
                    ลบรูป
                  </Button>
                ) : null}
              </Stack>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                JPG, PNG หรือ WEBP ขนาดไม่เกิน 5MB
              </Typography>
              {imageError ? <Alert severity="error">{imageError}</Alert> : null}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="color"
                label="สีหลัก"
                value={form.color}
                onChange={(event) => setField('color', event.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                type="color"
                label="สีรอง"
                value={form.accent}
                onChange={(event) => setField('accent', event.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Emoji"
                value={form.fruit}
                onChange={(event) => setField('fruit', event.target.value)}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label="ข้อความวิตามิน"
              value={form.meta}
              onChange={(event) => setField('meta', event.target.value)}
            />
            <TextField
              type="number"
              label="ลำดับการแสดง"
              value={form.sort_order}
              slotProps={{ htmlInput: { min: 0, max: 9999 } }}
              onChange={(event) => setField('sort_order', Number(event.target.value))}
            />
            <FormControlLabel
              label="แสดงสินค้านี้บน Landing"
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
          <Button color="inherit" onClick={closeDialog} disabled={saveMutation.isPending}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
