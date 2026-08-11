'use client';

import type { StoreStatus } from 'src/types/store';
import type { AdminLocationInput } from 'src/app/admin/locations/schema';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { adminLocationSchema } from 'src/app/admin/locations/schema';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

export type AdminStoreLocation = {
  id: string;
  name: string;
  address: string | null;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
  current_status: StoreStatus;
  estimated_quantity: number | null;
  last_reported_at: string | null;
  is_active: boolean;
  report_count: number;
};

type LocationReportImage = {
  id: string;
  image_url: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type AllLocationsPanelProps = {
  stores: AdminStoreLocation[];
};

const STATUS_COLOR: Record<StoreStatus, 'success' | 'warning' | 'error' | 'default'> = {
  available: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  unknown: 'default',
};

const APPROVAL_STATUS = {
  pending: { label: 'รอตรวจสอบ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'success' },
  rejected: { label: 'ปฏิเสธ', color: 'error' },
} as const;

async function fetchLocationReportImages(id: string): Promise<LocationReportImage[]> {
  const response = await fetch(`/api/admin/locations/${id}`);
  const payload = (await response.json()) as { images?: LocationReportImage[]; error?: string };

  if (!response.ok) throw new Error(payload.error ?? 'โหลดรูปภาพรายงานไม่สำเร็จ');
  return payload.images ?? [];
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            color: '#55296f',
            display: 'grid',
            borderRadius: 2,
            placeItems: 'center',
            bgcolor: 'rgba(85,41,111,.10)',
          }}
        >
          <Iconify icon={icon} width={26} />
        </Box>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
          <Typography sx={{ mt: 0.25, fontSize: 26, fontWeight: 900 }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function toFormValues(store: AdminStoreLocation): AdminLocationInput {
  return {
    name: store.name,
    address: store.address ?? '',
    province: store.province,
    district: store.district ?? '',
    subdistrict: store.subdistrict ?? '',
    latitude: store.latitude,
    longitude: store.longitude,
    is_active: store.is_active,
  };
}

export function AllLocationsPanel({ stores }: AllLocationsPanelProps) {
  const [locations, setLocations] = useState(stores);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingStore, setEditingStore] = useState<AdminStoreLocation | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    reset,
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLocationInput>({
    resolver: zodResolver(adminLocationSchema),
    defaultValues: {
      name: '',
      address: '',
      province: '',
      district: '',
      subdistrict: '',
      latitude: 0,
      longitude: 0,
      is_active: true,
    },
  });
  const {
    data: reportImages = [],
    isLoading: isLoadingImages,
    error: reportImagesError,
  } = useQuery({
    queryKey: ['admin-location-report-images', editingStore?.id],
    queryFn: () =>
      editingStore ? fetchLocationReportImages(editingStore.id) : Promise.resolve([]),
    enabled: Boolean(editingStore),
    staleTime: 60_000,
  });

  const knownQuantityStores = locations.filter((store) => store.estimated_quantity !== null);
  const totalQuantity = knownQuantityStores.reduce(
    (total, store) => total + (store.estimated_quantity ?? 0),
    0
  );
  const lowOrEmptyCount = locations.filter(
    (store) => store.current_status === 'low_stock' || store.current_status === 'out_of_stock'
  ).length;
  const paginatedStores = useMemo(
    () => locations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [locations, page, rowsPerPage]
  );

  const openEditDialog = (store: AdminStoreLocation) => {
    setEditingStore(store);
    setSaveError(null);
    setSuccessMessage(null);
    reset(toFormValues(store));
  };

  const closeEditDialog = () => {
    if (!isSubmitting) setEditingStore(null);
  };

  const saveLocation = handleSubmit(async (values) => {
    if (!editingStore) return;

    setSaveError(null);
    try {
      const response = await fetch(`/api/admin/locations/${editingStore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { store?: AdminStoreLocation; error?: string };

      if (!response.ok || !payload.store) {
        throw new Error(payload.error ?? 'บันทึกข้อมูลสาขาไม่สำเร็จ');
      }

      const updatedStore = { ...payload.store, report_count: editingStore.report_count };
      setLocations((current) =>
        current.map((store) => (store.id === updatedStore.id ? updatedStore : store))
      );
      setSuccessMessage(`แก้ไข “${updatedStore.name}” เรียบร้อยแล้ว`);
      setEditingStore(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'บันทึกข้อมูลสาขาไม่สำเร็จ');
    }
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            พิกัด Loveza ทั้งหมด
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            จำนวนคงเหลือเป็นข้อมูลล่าสุดจากรายงานที่ Admin อนุมัติ
          </Typography>
        </Box>
        <Chip
          label={`${locations.length} จุด`}
          color="secondary"
          sx={{ alignSelf: 'flex-start' }}
        />
      </Stack>

      {successMessage ? (
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <SummaryCard
          icon="ri:map-pin-2-fill"
          label="พิกัดทั้งหมด"
          value={`${locations.length} จุด`}
        />
        <SummaryCard
          icon="ri:drinks-2-fill"
          label={`ยอดคงเหลือจาก ${knownQuantityStores.length} จุด`}
          value={`${totalQuantity.toLocaleString('th-TH')} กระป๋อง`}
        />
        <SummaryCard
          icon="ri:alarm-warning-fill"
          label="เหลือน้อยหรือหมด"
          value={`${lowOrEmptyCount} จุด`}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell>ร้าน / พิกัด</TableCell>
              <TableCell align="center">แจ้งเข้ามา</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="right">จำนวนคงเหลือ</TableCell>
              <TableCell>รายงานล่าสุด</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStores.map((store) => {
              const location = [store.address, store.subdistrict, store.district, store.province]
                .filter(Boolean)
                .join(', ');
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;

              return (
                <TableRow key={store.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{store.name}</Typography>
                        <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                          {location ||
                            `${store.latitude.toFixed(6)}, ${store.longitude.toFixed(6)}`}
                        </Typography>
                      </Box>
                      {!store.is_active ? <Chip size="small" label="ปิดใช้งาน" /> : null}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      color={store.report_count > 0 ? 'secondary' : 'default'}
                      label={`${store.report_count.toLocaleString('th-TH')} ครั้ง`}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={STATUS_COLOR[store.current_status]}
                      label={STORE_STATUS_LABEL[store.current_status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 900 }}>
                      {store.estimated_quantity === null
                        ? 'ไม่ระบุ'
                        : `${store.estimated_quantity.toLocaleString('th-TH')} กระป๋อง`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {store.last_reported_at
                      ? new Date(store.last_reported_at).toLocaleString('th-TH')
                      : 'ยังไม่มีข้อมูล'}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Iconify icon="ri:edit-2-line" />}
                        onClick={() => openEditDialog(store)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        startIcon={<Iconify icon="ri:map-pin-line" />}
                      >
                        แผนที่
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  ยังไม่มีพิกัดที่ได้รับการอนุมัติ
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          page={page}
          count={locations.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          labelRowsPerPage="แสดงต่อหน้า"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} จาก ${count !== -1 ? count.toLocaleString('th-TH') : `มากกว่า ${to}`}`
          }
          getItemAriaLabel={(type) => {
            if (type === 'first') return 'ไปหน้าแรก';
            if (type === 'last') return 'ไปหน้าสุดท้าย';
            if (type === 'next') return 'ไปหน้าถัดไป';
            return 'ไปหน้าก่อนหน้า';
          }}
          showFirstButton
          showLastButton
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': {
              px: { xs: 1, sm: 2 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              justifyContent: { xs: 'center', sm: 'flex-end' },
            },
            '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
          }}
        />
      </TableContainer>

      <Dialog open={Boolean(editingStore)} onClose={closeEditDialog} fullWidth maxWidth="md">
        <Box component="form" onSubmit={saveLocation} noValidate>
          <DialogTitle sx={{ fontWeight: 900 }}>แก้ไขข้อมูลสาขา</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
              <TextField
                required
                autoFocus
                label="ชื่อสาขา"
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register('name')}
              />
              <TextField
                label="ที่อยู่"
                multiline
                minRows={2}
                error={Boolean(errors.address)}
                helperText={errors.address?.message}
                {...register('address')}
              />
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                <TextField
                  label="ตำบล / แขวง"
                  error={Boolean(errors.subdistrict)}
                  helperText={errors.subdistrict?.message}
                  {...register('subdistrict')}
                />
                <TextField
                  label="อำเภอ / เขต"
                  error={Boolean(errors.district)}
                  helperText={errors.district?.message}
                  {...register('district')}
                />
                <TextField
                  required
                  label="จังหวัด"
                  error={Boolean(errors.province)}
                  helperText={errors.province?.message}
                  {...register('province')}
                />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <TextField
                  required
                  type="number"
                  label="ละติจูด"
                  inputProps={{ step: 'any' }}
                  error={Boolean(errors.latitude)}
                  helperText={errors.latitude?.message}
                  {...register('latitude', { valueAsNumber: true })}
                />
                <TextField
                  required
                  type="number"
                  label="ลองจิจูด"
                  inputProps={{ step: 'any' }}
                  error={Boolean(errors.longitude)}
                  helperText={errors.longitude?.message}
                  {...register('longitude', { valueAsNumber: true })}
                />
              </Box>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="เปิดใช้งานและแสดงสาขานี้บนหน้าเว็บ"
                    control={
                      <Switch
                        name={field.name}
                        checked={field.value}
                        inputRef={field.ref}
                        onBlur={field.onBlur}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                  />
                )}
              />
              <Divider />
              <Box>
                <Typography sx={{ fontWeight: 900 }}>
                  รูปภาพที่แนบจากรายงาน ({reportImages.length.toLocaleString('th-TH')})
                </Typography>
                <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                  คลิกรูปเพื่อเปิดดูภาพขนาดเต็ม
                </Typography>

                {isLoadingImages ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 3 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">กำลังโหลดรูปภาพ...</Typography>
                  </Stack>
                ) : reportImagesError ? (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {reportImagesError.message}
                  </Alert>
                ) : reportImages.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{ mt: 2, p: 3, textAlign: 'center', borderRadius: 2 }}
                  >
                    <Typography color="text.secondary">สาขานี้ยังไม่มีรูปภาพแนบ</Typography>
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      mt: 2,
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: 'repeat(2, minmax(0, 1fr))',
                        sm: 'repeat(4, minmax(0, 1fr))',
                      },
                    }}
                  >
                    {reportImages.map((image) => {
                      const approval = APPROVAL_STATUS[image.approval_status];

                      return (
                        <Paper
                          key={image.id}
                          component="a"
                          href={image.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          sx={{
                            p: 1,
                            color: 'inherit',
                            borderRadius: 2,
                            textDecoration: 'none',
                            transition: 'border-color 150ms ease',
                            '&:hover': { borderColor: 'secondary.main' },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: 1.5,
                              aspectRatio: '1 / 1',
                              bgcolor: 'grey.100',
                            }}
                          >
                            <Image
                              fill
                              unoptimized
                              src={image.image_url}
                              alt={`รูปแจ้งพิกัด ${editingStore?.name ?? ''}`}
                              sizes="(max-width: 600px) 44vw, 220px"
                              style={{ objectFit: 'cover' }}
                            />
                          </Box>
                          <Stack spacing={0.75} sx={{ mt: 1 }}>
                            <Chip
                              size="small"
                              color={approval.color}
                              label={approval.label}
                              sx={{ alignSelf: 'flex-start' }}
                            />
                            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                              {new Date(image.created_at).toLocaleString('th-TH')}
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={closeEditDialog} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {isSubmitting ? 'กำลังบันทึก' : 'บันทึกการแก้ไข'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
