'use client';

import type { z } from 'zod';

import { useForm } from 'react-hook-form';
import { useRef, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { thailandProvinces } from 'src/assets/data';

import { Form, Field } from 'src/components/hook-form';

import { FLAVOR_OPTIONS } from 'src/types/report';

import { useSubmitReportMutation } from './use-submit-report';
import { reportSchema, MAX_PHOTO_SIZE, ALLOWED_PHOTO_TYPES, type ReportFormState } from './schema';

const initialState: ReportFormState = { status: 'idle', message: '' };

type ReportFormInput = z.input<typeof reportSchema>;

const defaultValues: ReportFormInput = {
  storeName: '',
  province: null,
  district: null,
  address: '',
  latitude: undefined,
  longitude: undefined,
  stockStatus: 'available',
  estimatedQuantity: '',
  flavors: [],
  photo: null,
  note: '',
};

const FLAVOR_SELECT_OPTIONS = FLAVOR_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));
const PROVINCE_OPTIONS = thailandProvinces.map((province) => province.nameTh);

export function ReportForm() {
  const mutation = useSubmitReportMutation();
  const state: ReportFormState =
    mutation.data ??
    (mutation.isError
      ? { status: 'error', message: 'ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง' }
      : initialState);
  const pending = mutation.isPending;
  const {
    coordinates: gps,
    isLoading: locating,
    error: gpsError,
    requestLocation,
  } = useGeolocation();

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(reportSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const [latitude, longitude, province] = watch(['latitude', 'longitude', 'province']);
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const locationError = errors.latitude?.message ?? errors.longitude?.message;

  const districtOptions = useMemo(
    () =>
      thailandProvinces.find((item) => item.nameTh === province)?.districts.map((d) => d.nameTh) ??
      [],
    [province]
  );

  useEffect(() => {
    if (!gps) return;
    setValue('latitude', gps.latitude, { shouldValidate: true });
    setValue('longitude', gps.longitude, { shouldValidate: true });
  }, [gps, setValue]);

  const previousProvinceRef = useRef(province);
  useEffect(() => {
    if (previousProvinceRef.current !== province) {
      setValue('district', null, { shouldValidate: false });
      previousProvinceRef.current = province;
    }
  }, [province, setValue]);

  useEffect(() => {
    if (state.status !== 'success') return;
    methods.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set('storeName', data.storeName);
    formData.set('province', data.province ?? '');
    formData.set('district', data.district ?? '');
    if (data.address) formData.set('address', data.address);
    formData.set('latitude', String(data.latitude));
    formData.set('longitude', String(data.longitude));
    formData.set('stockStatus', data.stockStatus);
    if (data.estimatedQuantity !== null) {
      formData.set('estimatedQuantity', String(data.estimatedQuantity));
    }
    data.flavors.forEach((flavor) => formData.append('flavors', flavor));
    if (data.photo) formData.set('photo', data.photo);
    if (data.note) formData.set('note', data.note);

    mutation.mutate(formData);
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.25}>
        <Field.Text name="storeName" label="ชื่อร้าน *" />

        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'text.secondary' }}>
            ตำแหน่ง *
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Autocomplete
              name="province"
              label="จังหวัด *"
              options={PROVINCE_OPTIONS}
              sx={{ flex: 1 }}
            />
            <Field.Autocomplete
              name="district"
              label="อำเภอ/เขต *"
              options={districtOptions}
              disabled={!province}
              helperText={!province ? 'เลือกจังหวัดก่อน' : undefined}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Field.Text name="address" label="ที่อยู่/สาขา (ถ้ามี)" />
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              type="button"
              variant="outlined"
              onClick={requestLocation}
              disabled={locating}
              sx={{ border: '2px solid #351129', boxShadow: '3px 3px 0 #351129' }}
            >
              {locating ? <CircularProgress size={20} /> : 'ใช้ตำแหน่งปัจจุบัน'}
            </Button>
            {hasCoordinates ? <Chip color="success" label="จับตำแหน่งแล้ว" size="small" /> : null}
          </Stack>
          {gpsError ? (
            <Alert severity="warning" sx={{ whiteSpace: 'pre-line' }}>
              {gpsError}
            </Alert>
          ) : null}
          {locationError ? <Alert severity="warning">{locationError}</Alert> : null}
        </Stack>

        <Field.Select name="stockStatus" label="สถานะสินค้า *">
          <MenuItem value="available">มีสินค้า</MenuItem>
          <MenuItem value="low_stock">เหลือน้อย</MenuItem>
          <MenuItem value="out_of_stock">สินค้าหมด</MenuItem>
          <MenuItem value="unknown">ไม่แน่ใจ</MenuItem>
        </Field.Select>

        <Field.Text
          name="estimatedQuantity"
          type="number"
          label="จำนวนที่เหลือโดยประมาณ (กระป๋อง)"
          slotProps={{ htmlInput: { min: 0, max: 9999, inputMode: 'numeric' } }}
        />

        <Field.MultiSelect checkbox name="flavors" label="รสชาติ" options={FLAVOR_SELECT_OPTIONS} />

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'text.secondary' }}>
            รูปภาพ
          </Typography>
          <Field.Upload
            name="photo"
            accept={{ 'image/*': [] }}
            maxSize={MAX_PHOTO_SIZE}
            helperText={`ไฟล์ ${ALLOWED_PHOTO_TYPES.map((type) => type.split('/')[1]).join(', ')} ไม่เกิน 5MB`}
            onDelete={() => setValue('photo', null, { shouldValidate: true })}
          />
        </Stack>

        <Field.Text name="note" label="หมายเหตุ" multiline minRows={3} />

        {state.status !== 'idle' ? (
          <Alert severity={state.status === 'success' ? 'success' : 'error'}>{state.message}</Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          size="large"
          sx={{
            color: '#351129',
            border: '2px solid #351129',
            borderRadius: 99,
            backgroundImage: 'none',
            bgcolor: '#FDE047',
            boxShadow: '4px 5px 0 #351129',
            '&:hover': { bgcolor: '#FFE96B', boxShadow: '2px 3px 0 #351129' },
          }}
        >
          {pending ? <CircularProgress size={24} color="inherit" /> : 'ส่งพิกัด'}
        </Button>
        <Typography sx={{ color: 'text.secondary', fontSize: 12, textAlign: 'center' }}>
          ระบบจะบันทึกบัญชี Google ผู้แจ้งเพื่อป้องกันข้อมูลไม่ถูกต้อง
        </Typography>
      </Stack>
    </Form>
  );
}
