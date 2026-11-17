'use client';

import type { LovezaProduct } from 'src/types/loveza-product';
import type { ProductInput } from 'src/app/admin/products/schema';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
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
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { PRODUCT_IMAGE_TYPES, MAX_PRODUCT_IMAGE_SIZE } from 'src/lib/supabase/product-image';
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
  is_new: true,
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
  is_new: product.is_new ?? false,
});

export function ProductsPanel() {
  const { data: products = [], isLoading, isError } = useAdminProductsQuery();
  const saveMutation = useSaveProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(products.length / rowsPerPage) - 1));
  const visibleProducts = products.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );
  const [deleteProduct, setDeleteProduct] = useState<LovezaProduct | null>(null);
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

  const setField = <Key extends keyof ProductFormValue>(key: Key, value: ProductFormValue[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

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
    deleteMutation.reset();
    setDeleteProduct(product);
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
          sx={{ flexShrink: 0, borderRadius: '12px' }}
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
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table sx={{ minWidth: 900 }} aria-label="รายการสินค้า">
            <TableHead>
              <TableRow>
                <TableCell>สินค้า</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">ลำดับ</TableCell>
                <TableCell>สินค้าใหม่</TableCell>
                <TableCell>การแสดงผล</TableCell>
                <TableCell align="right">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProducts.map((product) => (
                <TableRow
                  key={product.id}
                  hover
                  sx={{ height: 112, '& .MuiTableCell-root': { py: 2 } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 56,
                          height: 80,
                          overflow: 'hidden',
                          p: 0.5,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          borderRadius: '10px',
                          bgcolor: 'background.default',
                          fontSize: 28,
                        }}
                      >
                        {product.image_url ? (
                          <Box
                            component="img"
                            src={product.image_url}
                            alt={product.name}
                            sx={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              minWidth: 0,
                              minHeight: 0,
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          product.fruit
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }}>{product.thai_name}</Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {product.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>/{product.slug}</TableCell>
                  <TableCell align="center">{product.sort_order}</TableCell>
                  <TableCell>
                    {product.is_new ? (
                      <Chip size="small" label="NEW" color="secondary" />
                    ) : (
                      <Typography sx={{ color: 'text.disabled' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={product.is_active ? 'success' : 'default'}
                      label={product.is_active ? 'แสดงบนเว็บ' : 'ซ่อน'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`แก้ไข ${product.name}`}
                      onClick={() => openEdit(product)}
                    >
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
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    ยังไม่มีสินค้า กด “เพิ่มสินค้า” เพื่อเริ่มต้น
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            page={currentPage}
            count={products.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            labelRowsPerPage="แสดงต่อหน้า"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} จาก ${count.toLocaleString('th-TH')}`
            }
            getItemAriaLabel={(type) =>
              ({
                first: 'ไปหน้าแรก',
                last: 'ไปหน้าสุดท้าย',
                next: 'ไปหน้าถัดไป',
                previous: 'ไปหน้าก่อนหน้า',
              })[type]
            }
            showFirstButton
            showLastButton
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-toolbar': {
                px: { xs: 1, sm: 2 },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: 'flex-end',
              },
              '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
            }}
          />
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        aria-labelledby="product-dialog-title"
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.5, sm: 3 },
              width: 'calc(100% - 24px)',
              maxHeight: 'calc(100dvh - 32px)',
            },
          },
        }}
      >
        <DialogTitle id="product-dialog-title" sx={{ pb: 1.5 }}>
          {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
          <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
            จัดการรูป รายละเอียด และการแสดงผลสินค้าในหน้าแรก
          </Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 1,
            pb: 3,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider', borderWidth: '1px' },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.light',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: '1.5px',
            },
            '& .MuiFormHelperText-root': { mt: 0.75, lineHeight: 1.6 },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              pt: 1,
              alignItems: 'start',
              gridTemplateColumns: { xs: '1fr', sm: '180px minmax(0, 1fr)' },
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={1.25}>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>รูปสินค้า</Typography>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="ตัวอย่างรูปสินค้า"
                      sx={{
                        width: 1,
                        height: { xs: 140, sm: 180 },
                        objectFit: 'contain',
                        borderRadius: '10px',
                        bgcolor: 'background.default',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 1,
                        height: { xs: 140, sm: 180 },
                        color: 'text.secondary',
                        display: 'grid',
                        borderRadius: '10px',
                        placeItems: 'center',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Iconify icon="ri:image-add-line" width={34} />
                    </Box>
                  )}
                </Box>
                <Stack
                  spacing={1.25}
                  sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<Iconify icon="ri:upload-2-line" />}
                    >
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
              </Stack>
            </Box>
            <Stack spacing={2} sx={{ minWidth: 0, '& .MuiTextField-root': { width: 1 } }}>
              {saveMutation.isError ? (
                <Alert severity="error">{saveMutation.error.message}</Alert>
              ) : null}
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <TextField
                  size="small"
                  required
                  label="ชื่อสินค้า"
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
                <TextField
                  size="small"
                  required
                  label="ชื่อภาษาไทย"
                  value={form.thai_name}
                  onChange={(event) => setField('thai_name', event.target.value)}
                />
              </Box>
              <TextField
                size="small"
                required
                label="Slug"
                helperText="ใช้ a-z, 0-9 และขีดกลาง เช่น honey-lemon"
                value={form.slug}
                onChange={(event) => setField('slug', toSlug(event.target.value))}
              />
              <TextField
                size="small"
                multiline
                minRows={2}
                label="คำอธิบาย"
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  size="small"
                  type="color"
                  label="สีหลัก"
                  value={form.color}
                  onChange={(event) => setField('color', event.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="color"
                  label="สีรอง"
                  value={form.accent}
                  onChange={(event) => setField('accent', event.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Emoji"
                  value={form.fruit}
                  onChange={(event) => setField('fruit', event.target.value)}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1.6fr) minmax(0, 1fr)' },
                }}
              >
                <TextField
                  size="small"
                  label="ข้อความวิตามิน"
                  value={form.meta}
                  onChange={(event) => setField('meta', event.target.value)}
                />
                <TextField
                  size="small"
                  type="number"
                  label="ลำดับการแสดง"
                  value={form.sort_order}
                  slotProps={{ htmlInput: { min: 0, max: 9999 } }}
                  onChange={(event) => setField('sort_order', Number(event.target.value))}
                />
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  bgcolor: 'primary.lighter',
                  borderRadius: '12px',
                  '& .MuiFormControlLabel-root': { m: 0 },
                  '& .MuiFormControlLabel-label': { fontSize: 14 },
                }}
              >
                <FormControlLabel
                  label="ติดป้าย NEW — สินค้าใหม่"
                  control={
                    <Switch
                      checked={form.is_new}
                      onChange={(event) => setField('is_new', event.target.checked)}
                    />
                  }
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
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Button color="inherit" onClick={closeDialog} disabled={saveMutation.isPending}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(deleteProduct)}
        onClose={deleteMutation.isPending ? undefined : () => setDeleteProduct(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="delete-product-title"
        aria-describedby="delete-product-description"
      >
        <DialogTitle id="delete-product-title">ลบสินค้านี้ใช่ไหม?</DialogTitle>
        <DialogContent>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ p: 2, mb: 2, bgcolor: 'background.default', borderRadius: '12px' }}
          >
            <Iconify
              icon="ri:delete-bin-6-line"
              width={28}
              sx={{ color: 'error.main', flexShrink: 0 }}
            />
            <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
              {deleteProduct?.thai_name || deleteProduct?.name}
            </Typography>
          </Stack>
          <Typography
            id="delete-product-description"
            sx={{ color: 'text.secondary', fontSize: 14 }}
          >
            สินค้าจะถูกลบออกจากระบบ การลบนี้ไม่สามารถย้อนกลับได้
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteMutation.error.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteProduct(null)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending || !deleteProduct}
            onClick={() => {
              if (!deleteProduct || deleteMutation.isPending) return;
              deleteMutation.mutate(deleteProduct.id, { onSuccess: () => setDeleteProduct(null) });
            }}
            startIcon={
              deleteMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="ri:delete-bin-6-line" />
              )
            }
          >
            {deleteMutation.isPending ? 'กำลังลบ' : 'ยืนยันลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
