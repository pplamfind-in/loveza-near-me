'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';

import { compressImage } from 'src/utils/compress-image';

import { createClient } from 'src/lib/supabase/client';
import { createReport, uploadReportPhoto } from 'src/services/reports.service';
import {
  reportFormSchema,
  FLAVOR_SUGGESTIONS,
  STOCK_STATUS_OPTIONS,
  type ReportFormValues,
} from 'src/validations/report.schema';

import { ImageUpload } from './image-upload';
import { LocationPicker } from './location-picker';

// ----------------------------------------------------------------------

type ReportFormProps = {
  defaultValues?: Partial<ReportFormValues>;
};

export function ReportForm({ defaultValues }: ReportFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      storeName: '',
      province: '',
      district: '',
      subdistrict: '',
      latitude: undefined as unknown as number,
      longitude: undefined as unknown as number,
      flavor: '',
      stockStatus: 'unknown',
      note: '',
      ...defaultValues,
    },
  });

  async function onSubmit(values: ReportFormValues) {
    setSubmitError(null);

    try {
      const supabase = createClient();
      let photoUrl: string | null = null;

      if (photoFile) {
        const compressed = await compressImage(photoFile);
        photoUrl = await uploadReportPhoto(supabase, compressed);
      }

      await createReport(supabase, {
        store_name: values.storeName,
        province: values.province,
        district: values.district || null,
        subdistrict: values.subdistrict || null,
        latitude: values.latitude,
        longitude: values.longitude,
        flavor: values.flavor || null,
        stock_status: values.stockStatus,
        photo_url: photoUrl,
        note: values.note || null,
      });

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'ส่งพิกัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
      );
    }
  }

  if (isSubmitted) {
    return (
      <Card variant="outlined" sx={{ p: 4 }}>
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
          <CheckCircleRounded sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h6" fontWeight={800}>
            ขอบคุณที่ช่วยแจ้งพิกัด
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ทีมงานจะตรวจสอบข้อมูลก่อนแสดงผลให้คนอื่นเห็น
          </Typography>
          <Button href="/latest" variant="contained" sx={{ mt: 1 }}>
            ดูพิกัดล่าสุด
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <Controller
        name="storeName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="ชื่อร้าน"
            error={!!errors.storeName}
            helperText={errors.storeName?.message}
            fullWidth
          />
        )}
      />

      <LocationPicker control={control} errors={errors} setValue={setValue} />

      <Controller
        name="flavor"
        control={control}
        render={({ field }) => (
          <Autocomplete
            freeSolo
            options={FLAVOR_SUGGESTIONS}
            value={field.value || ''}
            onInputChange={(_event, newValue) => field.onChange(newValue)}
            renderInput={(params) => <TextField {...params} label="รสชาติที่พบ" fullWidth />}
          />
        )}
      />

      <Controller
        name="stockStatus"
        control={control}
        render={({ field }) => (
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={700}>
              สถานะสินค้า
            </Typography>
            <RadioGroup {...field}>
              {STOCK_STATUS_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </Stack>
        )}
      />

      <ImageUpload file={photoFile} onChange={setPhotoFile} />

      <Controller
        name="note"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="หมายเหตุ (ไม่บังคับ)" multiline minRows={2} fullWidth />
        )}
      />

      {submitError && <Alert severity="error">{submitError}</Alert>}

      <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
        ส่งพิกัด
      </Button>
    </Stack>
  );
}
