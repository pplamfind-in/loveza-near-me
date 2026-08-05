'use client';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { ReportFormValues } from 'src/validations/report.schema';

import { useEffect } from 'react';
import { Controller } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MyLocationRounded from '@mui/icons-material/MyLocationRounded';

import { useGeolocation } from 'src/hooks/use-geolocation';

import { THAI_PROVINCES } from 'src/data/thai-provinces';

// ----------------------------------------------------------------------

type LocationPickerProps = {
  control: Control<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  setValue: UseFormSetValue<ReportFormValues>;
};

export function LocationPicker({ control, errors, setValue }: LocationPickerProps) {
  const geolocation = useGeolocation();

  useEffect(() => {
    if (!geolocation.coordinates) return;

    setValue('latitude', geolocation.coordinates.latitude, { shouldValidate: true });
    setValue('longitude', geolocation.coordinates.longitude, { shouldValidate: true });
  }, [geolocation.coordinates, setValue]);

  return (
    <Stack spacing={2}>
      <Controller
        name="province"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="จังหวัด"
            error={!!errors.province}
            helperText={errors.province?.message}
            fullWidth
          >
            {THAI_PROVINCES.map((item) => (
              <MenuItem key={item.code} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <Stack direction="row" spacing={2}>
        <Controller
          name="district"
          control={control}
          render={({ field }) => <TextField {...field} label="อำเภอ" fullWidth />}
        />
        <Controller
          name="subdistrict"
          control={control}
          render={({ field }) => <TextField {...field} label="ตำบล" fullWidth />}
        />
      </Stack>

      <Button
        variant="outlined"
        startIcon={<MyLocationRounded />}
        onClick={geolocation.requestLocation}
        loading={geolocation.isLoading}
      >
        ใช้ตำแหน่งปัจจุบัน
      </Button>

      {geolocation.error && (
        <Typography variant="caption" color="error">
          {geolocation.error}
        </Typography>
      )}

      <Stack direction="row" spacing={2}>
        <Controller
          name="latitude"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={Number.isFinite(field.value) ? field.value : ''}
              onChange={(event) => field.onChange(Number(event.target.value))}
              type="number"
              label="Latitude"
              error={!!errors.latitude}
              helperText={errors.latitude?.message}
              slotProps={{ htmlInput: { step: 'any', inputMode: 'decimal' } }}
              fullWidth
            />
          )}
        />
        <Controller
          name="longitude"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={Number.isFinite(field.value) ? field.value : ''}
              onChange={(event) => field.onChange(Number(event.target.value))}
              type="number"
              label="Longitude"
              error={!!errors.longitude}
              helperText={errors.longitude?.message}
              slotProps={{ htmlInput: { step: 'any', inputMode: 'decimal' } }}
              fullWidth
            />
          )}
        />
      </Stack>
    </Stack>
  );
}
