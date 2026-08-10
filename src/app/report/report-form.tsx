'use client';

import type { z } from 'zod';
import type { ReactNode } from 'react';

import { useForm } from 'react-hook-form';
import { useRef, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { thailandProvinces } from 'src/assets/data';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FLAVOR_OPTIONS, STORE_TYPE_OPTIONS } from 'src/types/report';

import { useStoreTypesQuery } from './use-store-types';
import { useSubmitReportMutation } from './use-submit-report';
import {
  type ReportStoreCandidate,
  useReportStoreCandidates,
} from './use-report-store-candidates';
import {
  reportSchema,
  MAX_PHOTO_SIZE,
  ALLOWED_PHOTO_TYPES,
  type ReportFormState,
  type ReportFormValues,
  LOCATION_REQUIRED_MESSAGE,
} from './schema';

const initialState: ReportFormState = { status: 'idle', message: '' };

type ReportFormInput = z.input<typeof reportSchema>;

const defaultValues: ReportFormInput = {
  storeName: '',
  storeType: 'general',
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
  storeId: undefined,
};

const FLAVOR_SELECT_OPTIONS = FLAVOR_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));
const PROVINCE_OPTIONS = thailandProvinces.map((province) => province.nameTh);

function buildFormData(data: ReportFormValues, storeId = data.storeId) {
  const formData = new FormData();
  formData.set('storeName', data.storeName);
  formData.set('storeType', data.storeType);
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
  if (storeId) formData.set('storeId', storeId);
  return formData;
}

type FormSectionProps = {
  step: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  children: ReactNode;
};

function FormSection({ step, icon, title, description, color, children }: FormSectionProps) {
  return (
    <Box
      component="section"
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: '2px solid #351129',
        borderRadius: 3.5,
        bgcolor: '#fff',
        boxShadow: '4px 5px 0 #351129',
      }}
    >
      <Box sx={{ mb: 2.25, display: 'flex', gap: 1.25, alignItems: 'center' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            display: 'grid',
            flexShrink: 0,
            color: '#351129',
            borderRadius: '50%',
            placeItems: 'center',
            bgcolor: color,
            border: '2px solid #351129',
            boxShadow: '2px 2px 0 #351129',
          }}
        >
          <Iconify icon={icon} width={23} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#E5007E', fontSize: 10, fontWeight: 1000, letterSpacing: 1.5 }}>
            STEP {step}
          </Typography>
          <Typography component="h2" sx={{ color: '#351129', fontSize: 19, fontWeight: 1000 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.15, color: '#786B7C', fontSize: 12, fontWeight: 700 }}>
            {description}
          </Typography>
        </Box>
      </Box>
      {children}
    </Box>
  );
}

export function ReportForm() {
  const mutation = useSubmitReportMutation();
  const { data: masterStoreTypes = [] } = useStoreTypesQuery();
  const storeTypeOptions = masterStoreTypes.length
    ? masterStoreTypes.map((storeType) => ({
        value: storeType.code,
        label: storeType.name,
      }))
    : STORE_TYPE_OPTIONS;
  const state: ReportFormState =
    mutation.data ??
    (mutation.isError
      ? { status: 'error', message: 'ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง' }
      : initialState);
  const pending = mutation.isPending;
  const {
    coordinates: gps,
    isLoading: locating,
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

  const [latitude, longitude, province, selectedStoreId] = watch([
    'latitude',
    'longitude',
    'province',
    'storeId',
  ]);
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const hasLocationError = Boolean(errors.latitude || errors.longitude);
  const candidatesQuery = useReportStoreCandidates(
    hasCoordinates ? Number(latitude) : undefined,
    hasCoordinates ? Number(longitude) : undefined
  );
  const storeCandidates = candidatesQuery.data ?? [];
  const selectedCandidate = storeCandidates.find(
    (candidate) => candidate.storeId === selectedStoreId
  );

  const districtOptions = useMemo(
    () =>
      thailandProvinces.find((item) => item.nameTh === province)?.districts.map((d) => d.nameTh) ??
      [],
    [province]
  );

  useEffect(() => {
    if (!gps) return;
    setValue('storeId', undefined, { shouldValidate: true });
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

  const pendingValuesRef = useRef<ReportFormValues | null>(null);

  const handleSelectStoreCandidate = (candidate: ReportStoreCandidate) => {
    previousProvinceRef.current = candidate.province;
    setValue('storeId', candidate.storeId, { shouldValidate: true });
    setValue('storeName', candidate.storeName, { shouldValidate: true });
    setValue('storeType', candidate.storeType, { shouldValidate: true });
    setValue('address', candidate.address ?? '', { shouldValidate: true });
    setValue('province', candidate.province, { shouldValidate: true });
    setValue('district', candidate.district, { shouldValidate: true });
    mutation.reset();
  };

  const handleClearStoreCandidate = () => {
    setValue('storeId', undefined, { shouldValidate: true });
    mutation.reset();
  };

  useEffect(() => {
    if (state.status !== 'success') return;
    pendingValuesRef.current = null;
    methods.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const onSubmit = handleSubmit((data) => {
    pendingValuesRef.current = data;
    mutation.mutate(buildFormData(data));
  });

  const handleConfirmDuplicate = () => {
    if (state.status !== 'duplicate' || !pendingValuesRef.current) return;
    mutation.mutate(buildFormData(pendingValuesRef.current, state.candidate.storeId));
  };

  const handleRejectDuplicate = () => mutation.reset();

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          gap: 2.5,
          display: 'grid',
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormSection
            step="01"
            icon="ri:map-pin-2-fill"
            title="ปักพิกัดก่อน"
            description="ใช้ GPS ขณะอยู่บริเวณร้าน เพื่อดูว่ามีร้านนี้ในระบบแล้วหรือยัง"
            color="#FDE047"
          >
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  gap: 1.25,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  borderRadius: 2.5,
                  bgcolor: hasLocationError
                    ? '#FFF1F3'
                    : hasCoordinates
                      ? '#EAFBF4'
                      : '#FFF8D8',
                  border: '2px dashed',
                  borderColor: hasLocationError ? 'error.main' : '#351129',
                }}
                aria-invalid={hasLocationError}
              >
                <Button
                  type="button"
                  variant="contained"
                  onClick={requestLocation}
                  disabled={locating}
                  startIcon={
                    locating ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="ri:crosshair-2-fill" />
                    )
                  }
                  sx={{
                    color: '#fff',
                    borderRadius: 99,
                    bgcolor: '#E5007E',
                    border: '2px solid #351129',
                    boxShadow: '3px 3px 0 #351129',
                    '&:hover': { bgcolor: '#C9006E' },
                  }}
                >
                  {locating
                    ? 'กำลังหาพิกัด'
                    : hasCoordinates
                      ? 'อัปเดตพิกัด'
                      : 'ใช้ตำแหน่งปัจจุบัน'}
                </Button>
                {hasCoordinates ? (
                  <Box sx={{ minWidth: 0 }}>
                    <Chip
                      icon={<Iconify icon="ri:checkbox-circle-fill" />}
                      color="success"
                      label="ปักพิกัดสำเร็จ"
                      size="small"
                      sx={{ fontWeight: 900 }}
                    />
                    <Typography sx={{ mt: 0.45, color: '#28785B', fontSize: 10, fontWeight: 800 }}>
                      {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      color: hasLocationError ? 'error.main' : '#796518',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    ยังไม่ได้รับตำแหน่ง GPS
                  </Typography>
                )}
                {hasLocationError ? (
                  <Typography
                    role="alert"
                    sx={{
                      width: '100%',
                      color: 'error.main',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {LOCATION_REQUIRED_MESSAGE}
                  </Typography>
                ) : null}
              </Box>

              {candidatesQuery.isLoading ? (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                  กำลังตรวจหาร้านที่อยู่ใกล้พิกัดนี้...
                </Alert>
              ) : null}
              {candidatesQuery.isError ? (
                <Alert severity="warning">
                  ตรวจหาร้านใกล้เคียงไม่สำเร็จ คุณยังสามารถกรอกข้อมูลและส่งรายงานได้
                </Alert>
              ) : null}
              {storeCandidates.length ? (
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid #351129',
                    borderRadius: 2.5,
                    bgcolor: '#EEFDF8',
                    boxShadow: '3px 3px 0 #351129',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography sx={{ color: '#28785B', fontSize: 14, fontWeight: 1000 }}>
                        พิกัดนี้ใกล้ร้านที่มีอยู่แล้ว
                      </Typography>
                      <Typography sx={{ color: '#5D746B', fontSize: 11, fontWeight: 700 }}>
                        เลือกร้านให้ตรง ระบบจะใช้ชื่อที่ตรวจสอบแล้วให้ทันที
                      </Typography>
                    </Box>
                    {selectedCandidate ? (
                      <Button size="small" type="button" onClick={handleClearStoreCandidate}>
                        ไม่ใช่ร้านนี้
                      </Button>
                    ) : null}
                  </Stack>

                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {storeCandidates.map((candidate) => {
                      const selected = candidate.storeId === selectedStoreId;
                      const location = [candidate.address, candidate.district, candidate.province]
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <Box
                          key={candidate.storeId}
                          sx={{
                            p: 1.5,
                            gap: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: selected ? '#00A99D' : 'divider',
                            borderRadius: 2,
                            bgcolor: '#fff',
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 1000 }}>
                              {candidate.storeName}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                              {location || 'ไม่มีรายละเอียดที่อยู่'} · ห่างประมาณ{' '}
                              {candidate.distanceM.toLocaleString('th-TH')} เมตร
                            </Typography>
                          </Box>
                          <Button
                            type="button"
                            size="small"
                            variant={selected ? 'contained' : 'outlined'}
                            disabled={selected}
                            onClick={() => handleSelectStoreCandidate(candidate)}
                            sx={{ flexShrink: 0, borderRadius: 99 }}
                          >
                            {selected ? 'เลือกแล้ว' : 'ใช่ ฉันอยู่ที่นี่'}
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </FormSection>
        </Box>

        <Stack spacing={2.5}>
          <FormSection
            step="02"
            icon="ri:store-2-fill"
            title="เจอที่ร้านไหน?"
            description="เลือกจากร้านใกล้พิกัด หรือกรอกข้อมูลร้านใหม่เมื่อยังไม่มีในระบบ"
            color="#70E1F5"
          >
            <Stack spacing={2}>
              {!hasCoordinates ? (
                <Alert severity="info">ปักพิกัดใน Step 01 ก่อน เพื่อเปิดข้อมูลร้าน</Alert>
              ) : null}

              <Field.Select
                name="storeType"
                label="ประเภทร้านค้า *"
                disabled={!hasCoordinates || Boolean(selectedStoreId)}
                helperText={
                  selectedStoreId ? 'ใช้ข้อมูลจากร้านที่เลือกตามพิกัด GPS' : undefined
                }
              >
                {storeTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="storeName"
                label="ชื่อร้าน / ชื่อสาขา *"
                disabled={!hasCoordinates || Boolean(selectedStoreId)}
                helperText={selectedStoreId ? 'ล็อกชื่อร้านเพื่อป้องกันข้อมูลสะกดผิด' : undefined}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Field.Autocomplete
                  name="province"
                  label="จังหวัด *"
                  options={PROVINCE_OPTIONS}
                  disabled={!hasCoordinates || Boolean(selectedStoreId)}
                  sx={{ flex: 1 }}
                />
                <Field.Autocomplete
                  name="district"
                  label="อำเภอ/เขต *"
                  options={districtOptions}
                  disabled={
                    !hasCoordinates ||
                    !province ||
                    (Boolean(selectedStoreId) && Boolean(selectedCandidate?.district))
                  }
                  helperText={
                    selectedStoreId && !selectedCandidate?.district
                      ? 'ร้านนี้ยังไม่มีข้อมูลอำเภอ/เขต กรุณาเลือกให้ครบ'
                      : hasCoordinates && !province
                        ? 'เลือกจังหวัดก่อน'
                        : undefined
                  }
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Field.Text
                name="address"
                label="ที่อยู่ จุดสังเกต หรือชื่อสาขา (ถ้ามี)"
                disabled={!hasCoordinates || Boolean(selectedStoreId)}
              />
            </Stack>
          </FormSection>
        </Stack>

        <Stack spacing={2.5}>
          <FormSection
            step="03"
            icon="ri:drinks-2-fill"
            title="ความซ่ายังเหลือไหม?"
            description="อัปเดตสถานะ จำนวน และรสชาติที่เห็นบนชั้น"
            color="#FF8EC4"
          >
            <Stack spacing={2}>
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

              <Field.MultiSelect
                checkbox
                name="flavors"
                label="รสชาติที่พบ"
                options={FLAVOR_SELECT_OPTIONS}
              />
            </Stack>
          </FormSection>

          <FormSection
            step="04"
            icon="ri:camera-3-fill"
            title="เพิ่มหลักฐานความซ่า"
            description="รูปชั้นวางหรือหน้าร้านช่วยให้ข้อมูลน่าเชื่อถือขึ้น"
            color="#B8F3D6"
          >
            <Stack spacing={2}>
              <Field.Upload
                name="photo"
                accept={{ 'image/*': [] }}
                maxSize={MAX_PHOTO_SIZE}
                helperText={`รองรับ ${ALLOWED_PHOTO_TYPES.map((type) => type.split('/')[1]).join(', ')} ขนาดไม่เกิน 5MB`}
                onDelete={() => setValue('photo', null, { shouldValidate: true })}
              />
              <Field.Text
                name="note"
                label="เล่าเพิ่มอีกนิด (ถ้ามี)"
                placeholder="เช่น อยู่ใกล้แคชเชียร์ ชั้นวางด้านหน้า..."
                multiline
                minRows={3}
              />
            </Stack>
          </FormSection>
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: { xs: 2, sm: 2.5 },
          gap: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          borderRadius: 3.5,
          color: '#fff',
          bgcolor: '#351129',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 1000 }}>
            พร้อมแชร์พิกัดแล้วหรือยัง?
          </Typography>
          <Typography sx={{ mt: 0.35, color: '#E9DDEB', fontSize: 11, fontWeight: 700 }}>
            ข้อมูลของคุณช่วยให้แก๊ง Loveza ตามหาความซ่าได้แม่นขึ้น
          </Typography>
        </Box>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          size="large"
          endIcon={!pending ? <Iconify icon="ri:send-plane-fill" /> : undefined}
          sx={{
            minWidth: { sm: 190 },
            color: '#351129',
            border: '2px solid #fff',
            borderRadius: 99,
            backgroundImage: 'none',
            bgcolor: '#FDE047',
            boxShadow: '4px 5px 0 #E5007E',
            '&:hover': { bgcolor: '#FFE96B', boxShadow: '2px 3px 0 #E5007E' },
          }}
        >
          {pending ? <CircularProgress size={24} color="inherit" /> : 'แชร์พิกัดนี้'}
        </Button>
      </Box>

      {state.status === 'duplicate' ? (
        <Box
          sx={{
            mt: 2.5,
            p: { xs: 2, sm: 2.5 },
            border: '2px solid #351129',
            borderRadius: 3.5,
            bgcolor: '#FFF8D8',
            boxShadow: '4px 5px 0 #351129',
          }}
        >
          <Typography sx={{ fontWeight: 900 }}>{state.message}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              type="button"
              variant="contained"
              disabled={pending}
              onClick={handleConfirmDuplicate}
              startIcon={
                pending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Iconify icon="ri:checkbox-circle-fill" />
                )
              }
              sx={{
                color: '#fff',
                borderRadius: 99,
                bgcolor: '#E5007E',
                border: '2px solid #351129',
                boxShadow: '3px 3px 0 #351129',
                '&:hover': { bgcolor: '#C9006E' },
              }}
            >
              ใช่ ร้านเดิม
            </Button>
            <Button
              type="button"
              variant="outlined"
              disabled={pending}
              onClick={handleRejectDuplicate}
              sx={{ color: '#351129', borderColor: '#351129', borderRadius: 99 }}
            >
              ไม่ใช่ ร้านอื่น
            </Button>
          </Stack>
        </Box>
      ) : state.status !== 'idle' ? (
        <Alert sx={{ mt: 2.5 }} severity={state.status === 'success' ? 'success' : 'error'}>
          {state.message}
        </Alert>
      ) : null}
    </Form>
  );
}
